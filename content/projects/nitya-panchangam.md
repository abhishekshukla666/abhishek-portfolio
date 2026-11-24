---
title: "Nitya Panchangam"
weight: 1
status: live
statusLabel: "Live on the App Store"
icon: "projects/icons/nitya-panchangam.png"
summary: "A Hindu calendar that calculates sunrise, tithi, nakshatra and festivals for your exact location — with real astronomical math, on iPhone, Apple Watch and the home screen."
cardSummary: "A Hindu calendar with real astronomical math — sunrise, tithi, nakshatra and festivals for your exact location."
platforms: ["iPhone", "Apple Watch", "Widgets", "Android", "Wear OS"]
languages: "6 Indian languages"
cardStack: "SwiftUI · WidgetKit · Swiss Ephemeris"
links:
  - label: "View on the App Store"
    url: "https://apps.apple.com/in/app/nitya-panchangam/id6798105874"
    primary: true
  - label: "Get it for Android"
    url: "https://play.google.com/store/apps/details?id=com.shukla.nityapanchangam"
  - label: "Visit the app's page"
    url: "/nitya-panchangam/"
screenshots:
  - src: "projects/nitya-panchangam/today.webp"
    caption: "Today"
  - src: "projects/nitya-panchangam/month.webp"
    caption: "Month calendar"
  - src: "projects/nitya-panchangam/muhurat.webp"
    caption: "Muhurat, marked for your rashi"
  - src: "projects/nitya-panchangam/festivals.webp"
    caption: "Festivals and vrat"
  - src: "projects/nitya-panchangam/launch.webp"
    caption: "Launch"
problemTitle: "Panchang data is only useful if it is right for where you are"
problem: "A tithi or festival depends on the exact moment of local sunrise, so a calendar computed for one city is wrong for another. Most Panchang apps are ad-heavy, show one city's data, and do not explain where their numbers come from. I wanted a calm, accurate, bilingual Panchang that works offline and glances well on the wrist."
role: "Sole engineer and designer — product definition, iOS, watchOS and widgets, the Android and Wear OS versions, astronomy-engine integration, localisation in six Indian languages, and both store releases."
stack: ["Swift", "SwiftUI", "Swift Concurrency", "WidgetKit", "watchOS", "Core Location", "Swiss Ephemeris (C)", "Swift Testing", "String Catalogs", "Kotlin", "Jetpack Compose"]
problems:
  - title: "Wrapping a C astronomy library safely"
    problem: "Swiss Ephemeris is a C library with global state. Calling it from two threads at once does not crash — it quietly returns wrong answers."
    approach: "Every ephemeris call runs on one process-wide serial queue, shared by every instance of the repository. The rest of the app sees only a small async Swift API, and never touches the C layer."
  - title: "Widgets that change mid-day"
    problem: "A tithi or nakshatra can end at 2:14 pm. A widget refreshed hourly would be wrong for up to an hour."
    approach: "The widget computes every exact moment a value changes over the next 12 hours and hands WidgetKit one timeline entry per change. Entry building lives in its own type, so it is unit-tested without WidgetKit."
  - title: "Whose sunrise dates a festival?"
    problem: "Your daily Panchang must follow your own sunrise, but published calendars date festivals for a traditional reference city. Using the reader's location for both makes festivals disagree with every printed calendar."
    approach: "Daily values are computed for the reader's location; festivals are dated at Ujjain, the classical reference. Tests hold the engine to published calendars, city by city."
  - title: "Text that respects the reader's size"
    problem: "Every text style started as a fixed point size, so the app ignored the iOS text-size setting — and Devanagari at small sizes is hard to read."
    approach: "One `appFont` modifier built on `@ScaledMetric` replaced every fixed size. Text now scales with Dynamic Type, while the default setting keeps today's sizes, so no layout needed re-tuning."
related:
  - "blog/swift-actor-reentrancy.md"
  - "blog/swift-task-life-cycle.md"
  - "blog/sendable-explained.md"
---
