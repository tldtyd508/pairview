# Pairview product brief

## Service overview

- **Name:** Pairview
- **Tagline:** 함께한 경험, 서로 다른 리뷰.
- **MVP purpose:** Let a couple privately record and revisit their independent restaurant ratings and short reviews.
- **Vision:** Expand the same two-perspective log to anime, movies, trips, games, and other shared experiences.

## Users and value

- **Initial users:** One specific couple.
- **Future users:** Other invited pairs.
- **Core value:** Preserve two different tastes without collapsing them into an average score.
- **Privacy:** Each pair's records are isolated from every other pair.

## Confirmed MVP decisions

- Google login.
- A pair is connected through an invitation link or code.
- Each partner records their own score out of 5 and a one-line review.
- No average score is shown.
- Restaurant records include at least name, location, visit date, category, and ordered menu.
- History supports search, sorting, and filtering.
- The MVP is private; there is no public feed or public sharing.
- The visual style is minimal and mobile-first.

## Couple markers

A marker captures a pair-specific ritual or meaning attached to an experience.

- Each pair can define a marker name, color, and icon.
- Applying a marker is manual; the product may recommend it when a configured condition is met.
- A photo can optionally be attached to a marked record.
- The initial pair's marker is `셀카` and is relevant when both scores are at least 4.5.
- The marker system must not hard-code `셀카` as the universal behavior.

## Open decisions

1. On a repeat visit, should users update the existing record or create a new visit record?
2. Should marker recommendation conditions be configurable per pair in the MVP?
3. Which restaurant fields are required versus optional after testing the first entry flow?

Do not resolve these decisions implicitly during implementation. The schema may preserve future options, but user-visible behavior requires approval.

## Initial success criterion

The initial pair can sign in, connect, record both reviews for a restaurant, optionally mark and photograph the experience, and later find it without accessing any other pair's data.
