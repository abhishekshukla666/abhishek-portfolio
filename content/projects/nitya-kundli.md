---
title: "Nitya Kundli"
weight: 3
status: live
statusLabel: "Live on Google Play"
icon: "projects/icons/nitya-kundli.png"
summary: "Vedic birth charts, dashas, transits and Guna Milan for iPhone and Android, built on the same astronomy engine and localisation layer as Nitya Panchangam."
cardSummary: "Vedic birth charts, dashas and Guna Milan, built on the same astronomy engine as Panchangam."
platforms: ["iPhone", "Widgets", "Android"]
languages: "6 Indian languages"
cardStack: "SwiftUI · Swift Concurrency"
links:
  - label: "Get it on Google Play"
    url: "https://play.google.com/store/apps/details?id=com.shukla.nityakundli"
    primary: true
  - label: "Visit the Nitya Kundli page"
    url: "/nitya-kundli/"
problemTitle: "A second app should not mean a second engine"
problem: "A Kundli app needs the same planetary positions, the same Jyotish rules and the same Hindi terms as the Panchang app. Copying that code would let the two apps slowly disagree about the same chart."
role: "Sole engineer and designer — extracting the shared layers out of Nitya Panchangam into packages, and building the Kundli app on top of them."
stack: ["Swift", "SwiftUI", "Swift Concurrency", "Swift Package Manager", "WidgetKit", "Swiss Ephemeris (C)"]
problems:
  - title: "One engine, two apps"
    problem: "Both apps must compute the same chart for the same moment, and a bug report must be reproducible against an exact calculation build."
    approach: "The astronomy engine, the Jyotish rules, the core UI and the localisation layer are separate Swift packages. Both apps pin every package to an exact version — the same versions — so they can never be on different engines."
  - title: "Sharing without coupling"
    problem: "Kundli needs the calculation and view layers of Panchangam, but none of its screens or product decisions."
    approach: "Only the layers below the app are shared. Everything above them — navigation, screens, settings — belongs to each app, so either can change without breaking the other."
related:
  - "blog/swift-sendable.md"
  - "blog/solid-priciples.md"
---
