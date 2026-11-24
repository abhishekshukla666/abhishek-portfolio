// Prints the site's /resume/ page to an A4 PDF.
//
//   hugo server                      # in another terminal
//   swift Tools/make-resume-pdf.swift http://localhost:1313/resume/ static/resume/Abhishek-Shukla-Resume.pdf
//
// The resume is built from data/profile.yaml, data/experience.yaml and data/work.yaml,
// so edit those and run this again; never edit the PDF by hand.

import AppKit
import WebKit

let args = CommandLine.arguments
guard args.count == 3, let source = URL(string: args[1]) else {
    FileHandle.standardError.write(Data("usage: make-resume-pdf.swift <resume-url> <out.pdf>\n".utf8))
    exit(2)
}
let output = URL(fileURLWithPath: args[2])

@MainActor
final class Printer: NSObject, WKNavigationDelegate {
    let window: NSWindow
    let webView: WKWebView

    init(url: URL) {
        // A4 at 72 dpi, less the 40 pt margins on each side.
        let frame = NSRect(x: 0, y: 0, width: 515, height: 762)
        webView = WKWebView(frame: frame)
        window = NSWindow(contentRect: frame, styleMask: [.borderless], backing: .buffered, defer: false)
        super.init()
        window.contentView = webView
        webView.navigationDelegate = self
        webView.load(URLRequest(url: url))
    }

    nonisolated func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(1))   // let web fonts settle
            self.printPDF()
        }
    }

    nonisolated func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        Task { @MainActor in self.fail(error) }
    }

    nonisolated func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        Task { @MainActor in self.fail(error) }
    }

    func fail(_ error: Error) {
        FileHandle.standardError.write(Data("could not load the resume page: \(error.localizedDescription)\n".utf8))
        exit(1)
    }

    func printPDF() {
        let info = NSPrintInfo()
        info.paperSize = NSSize(width: 595.28, height: 841.89)
        info.topMargin = 40; info.bottomMargin = 40; info.leftMargin = 40; info.rightMargin = 40
        info.horizontalPagination = .fit
        info.verticalPagination = .automatic
        info.isHorizontallyCentered = false
        info.isVerticallyCentered = false
        info.jobDisposition = .save
        info.dictionary()[NSPrintInfo.AttributeKey.jobSavingURL] = output

        let operation = webView.printOperation(with: info)
        operation.showsPrintPanel = false
        operation.showsProgressPanel = false
        operation.view?.frame = webView.bounds
        operation.runModal(for: window, delegate: self, didRun: #selector(printed(_:success:contextInfo:)), contextInfo: nil)
    }

    @objc func printed(_ operation: NSPrintOperation, success: Bool, contextInfo: UnsafeMutableRawPointer?) {
        print(success ? "wrote \(output.path)" : "printing failed")
        exit(success ? 0 : 1)
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let printer = MainActor.assumeIsolated { Printer(url: source) }
withExtendedLifetime(printer) { app.run() }
