---
title: "Resilient Networking in Swift: Building a Retry Mechanism"
# description: "Network requests fail. Learn how, when, and where to implement a robust retry mechanism with exponential backoff in Swift to create a seamless user experience."
date: "2026-07-06T12:00:00+05:30"
draft: false
tags: ["Swift", "Networking", "Architecture", "Concurrency", "Async/Await"]
weight: 115
# cover:
    # image: "blog/NetworkRetry.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

Mobile devices are inherently mobile. Your users will walk into elevators, drive through tunnels, and seamlessly hop between Wi-Fi and 5G. Because of this, network requests fail—a lot. 

If your application instantly shows an error alert the millisecond a connection drops, you are providing a poor user experience. Instead, your app should gracefully handle transient network errors behind the scenes.

This is where a **Retry Mechanism** comes in. Let’s explore *why*, *when*, *where*, and *how* to implement a robust retry strategy using modern Swift Concurrency.

---

## Why Implement a Retry Mechanism?

When a user taps "Upload Document," they expect it to upload. If the connection drops for two seconds midway through, failing the entire operation forces the user to manually start over. 

A retry mechanism intercepts these brief failures, waits a moment, and tries again without bothering the user. 
* **Improves UX:** Users see fewer error screens.
* **Handles Server Blips:** APIs occasionally timeout or return 502 Bad Gateway errors during deployments. A quick retry often succeeds.
* **Increases Success Rates:** Background tasks and large file uploads are far more likely to complete.

## When (and When NOT) to Retry

You should not retry *every* error. If you retry a request with a bad password (401 Unauthorized), it will fail 100% of the time, wasting battery and data.

### ✅ DO Retry (Transient Errors)
* **Timeouts** (`URLError.timedOut`)
* **Connection Drops** (`URLError.networkConnectionLost`)
* **No Internet** (`URLError.notConnectedToInternet`) - *Though often better handled by a reachability monitor.*
* **Server Errors** (HTTP 500, 502, 503, 504)

### ❌ DO NOT Retry (Permanent/Client Errors)
* **Client Errors** (HTTP 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found)
* **Business Logic Errors** (e.g., "Username already taken")
* **Explicit Task Cancellation** (If the user tapped "Cancel Upload", do not retry it behind their back!)

## Where to Implement Retry Logic

**In the Network Layer.** Do not put retry logic inside your ViewModels or ViewControllers. The UI layer should simply say: `"Hey NetworkManager, upload this file and let me know when it's done."` 

The `NetworkManager` should be responsible for intercepting the failure, applying a backoff strategy, retrying, and only reporting back to the ViewModel if the failure is permanent.

---

## How to Implement: Exponential Backoff

If the server is struggling, hitting it with 5 retries in 1 second will only make it crash faster. The industry standard is **Exponential Backoff**. 

You wait 1 second for the first retry, 2 seconds for the second, 4 seconds for the third, and so on.

### The Real-World Example: A Cancelled File Upload

Imagine an app where a user uploads a high-resolution profile picture. Due to a flaky 5G tower, the connection is suddenly lost midway, throwing a `URLError.networkConnectionLost` (which behaves similarly to a dropped/cancelled connection at the socket level). 

Here is how we build a resilient `NetworkManager` to handle this using `async/await`.

```swift
import Foundation

enum NetworkError: Error {
    case maxRetriesReached
    case invalidResponse
    case clientError(statusCode: Int)
}

class NetworkManager {
    
    /// Uploads a file with an automatic retry mechanism.
    /// - Parameters:
    ///   - data: The file data to upload.
    ///   - url: The destination URL.
    ///   - maxRetries: Maximum number of times to retry before failing.
    func uploadFile(data: Data, to url: URL, maxRetries: Int = 3) async throws {
        var retries = 0
        var currentDelay = 1.0 // Start with a 1-second delay
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        
        while retries <= maxRetries {
            do {
                print("Attempt \(retries + 1): Uploading file...")
                
                // 1. Attempt the network request
                let (_, response) = try await URLSession.shared.upload(for: request, from: data)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw NetworkError.invalidResponse
                }
                
                // 2. Check the status code
                switch httpResponse.statusCode {
                case 200...299:
                    print("✅ Upload successful!")
                    return // Exit the function, we are done!
                    
                case 400...499:
                    // Client error (e.g., 401 Unauthorized). Do NOT retry.
                    print("❌ Client error \(httpResponse.statusCode). Aborting.")
                    throw NetworkError.clientError(statusCode: httpResponse.statusCode)
                    
                case 500...599:
                    // Server error. Throw so the catch block can retry it.
                    print("⚠️ Server error \(httpResponse.statusCode).")
                    throw URLError(.badServerResponse)
                    
                default:
                    throw NetworkError.invalidResponse
                }
                
            } catch {
                // 3. Evaluate the error to see if we should retry
                if shouldRetry(error: error), retries < maxRetries {
                    print("⚠️ Upload failed: \(error.localizedDescription).")
                    print("⏳ Retrying in \(currentDelay) seconds...")
                    
                    // Sleep for the delay (without blocking the thread!)
                    try await Task.sleep(nanoseconds: UInt64(currentDelay * 1_000_000_000))
                    
                    // Increase retries and double the delay (Exponential Backoff)
                    retries += 1
                    currentDelay *= 2.0 
                } else {
                    // If it's not a transient error, or we ran out of retries, throw it to the UI.
                    print("❌ Upload failed permanently.")
                    throw error
                }
            }
        }
        
        throw NetworkError.maxRetriesReached
    }
    
    /// Determines if an error is transient and worth retrying.
    private func shouldRetry(error: Error) -> Bool {
        // Do not retry if the Task was explicitly cancelled by the user
        if error is CancellationError {
            return false
        }
        
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain {
            // Only retry specific transient network errors
            let retriableCodes = [
                NSURLErrorTimedOut,
                NSURLErrorCannotFindHost,
                NSURLErrorCannotConnectToHost,
                NSURLErrorNetworkConnectionLost, // E.g., driving through a tunnel
                NSURLErrorDNSLookupFailed,
                NSURLErrorNotConnectedToInternet
            ]
            return retriableCodes.contains(nsError.code)
        }
        
        return false
    }
}

```

### How to use this in a ViewModel

Because the network layer abstracts all the messy retry logic, your ViewModel remains incredibly clean. It doesn't know *how* the `NetworkManager` retried; it only cares about the final outcome.

```swift
@MainActor
class ProfileViewModel: ObservableObject {
    @Published var uploadState: String = "Idle"
    let networkManager = NetworkManager()
    
    func saveProfilePicture(imageData: Data) async {
        uploadState = "Uploading..."
        
        do {
            let url = URL(string: "[https://api.example.com/upload](https://api.example.com/upload)")!
            try await networkManager.uploadFile(data: imageData, to: url)
            uploadState = "Upload Complete!"
        } catch {
            uploadState = "Failed to upload: \(error.localizedDescription)"
        }
    }
}

```

---

## Final Thoughts

Adding a retry mechanism is one of the highest-impact things you can do to make an iOS app feel "premium" and reliable.

By pushing this logic down into the network layer, utilizing `async/await` for non-blocking delays, and strictly checking which errors are actually retriable, you protect both your users' sanity and your servers' stability.