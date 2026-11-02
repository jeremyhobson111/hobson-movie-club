# Area: survey

Source: the family survey written by Dave (pasted by the owner, 2026-11-01). Questions are final text; do not reword without asking. All movie picks are movies available on Plex. Plan is one movie per week.

Intro shown at top: the Family Movie Club is making a comeback, wider variety than Oscar nominees (member favorites, genres, highly rated, hidden gems, classics), input wanted on how the club should work. Sign-off: "Dave".

Type key: multi = select all that apply, single = pick one, top3 = pick exactly three, text = free text.

1. What movie genres do you enjoy watching? (multi) Action; Comedy; Drama; Thriller / Suspense; Horror; Science Fiction; Fantasy; Adventure; Mystery / Crime; Romance; Documentary; Animation; Musical; Sports; War / History; Western; Other (text)
2. What are your TOP 3 all-time favorite movies? (text, three entries)
3. Any genres you would prefer NOT to watch? (multi) Horror; Romance; Musicals; War movies; Documentaries; Foreign-language films; None, I'm open to anything!; Other (text)
4. How open are you to watching movies you have never heard of? (single) Very open; Somewhat open (depending on the description); Not very open (prefer familiar); I would rather stick with movies I know I'll enjoy
5. Which THREE movie club formats sound most appealing? (top3) Member Favorites; Genre of the Month; Rotten Tomatoes Challenge; 80s to Today; Hidden Gems; Classic Movies; Random Selection; Themed Nights; Member's Choice; Combination
6. How important should Rotten Tomatoes ratings be? (single) Only 90%+ on BOTH Tomatometer and Popcornmeter; 90%+ on EITHER; 80%+ on EITHER; Ratings should be a guide, not a restriction; Ratings don't matter to me
7. What movie decades would you most like to explore? (single) 1980s and newer; 1990s and newer; 2000s and newer; 1970s and newer; 1960s and newer; Any decade
8. Should members be able to submit their own favorites to the selection pool? (single) Absolutely!; Yes, occasionally; Maybe, depending on the movie; No preference
9. How often would you realistically participate? (single) Every week; Every two weeks; Once a month; Whenever my schedule allows
10. How should we decide who selects or introduces the weekly movie? (single) Randomly select a family member each week; Rotate through family members; Randomly draw from the submitted movie list; Have one person manage all selections; A combination of these methods
11. What did you enjoy MOST about the original club? (multi) Reason to get together as a family; Anticipation of finding out the movie; Discovering movies I might not have watched; Sharing our opinions; The friendly debates and disagreements; Rating and voting on the movies; Comparing everyone's ratings; All of the above!
12. How important is it that members share opinions, discuss, and vote? (single) Very important; Somewhat important; I enjoy it, but it's not necessary; I mainly want to watch the movies
13. Would you enjoy a group discussion after everyone has watched the weekly movie? (single) Yes! I would love that; Maybe, depending on the movie; Occasionally; No, I prefer to watch on my own
14. Interested in occasionally revisiting movies some members have already seen? (single) Absolutely; Yes, but only occasionally; I'd rather stick with movies I haven't seen; No preference
15. Would you enjoy an annual FAMILY MOVIE CLUB HALL OF FAME? (single) Absolutely!; Maybe; Not particularly
16. What awards would you like at the end of each year? (multi) Best Overall Movie; Best Comedy; Best Action Movie; Best Drama; Best Classic Movie; Biggest Surprise; Most Divisive Movie; Most Rewatchable Movie; Worst Movie of the Year; Family Favorite / People's Choice
17. What would make you MOST excited about participating again? (multi) Better movie selections; More variety; More interaction with family; Friendly competition and voting; Flexibility to participate when I can; Fun themes, challenges, and annual awards; All of the above!
18. What is ONE thing the club MUST include to be successful? (text)
19. Any other ideas, suggestions, or changes? (text)

Closing message: "Thanks for taking the time to share your thoughts!" plus the goal paragraph (bring the family together, discover great movies, share opinions, friendly debates, make memories).

## Notes for building
- "All of the above" / "None" options should clear the other boxes in that question.
- Results page (who answered what) is a likely follow-up; not in v1 unless asked.

## Database
- Applied to the Supabase project on 2026-11-01. Table `survey_responses` (migration `supabase/migrations/20261101000000_survey_responses.sql`): one row per person, `answers` is JSON keyed by question number ("1".."19").
- Each person sees and edits only their own row (row-level security). The owner reads everyone's answers in the Supabase dashboard for now; a results page is not in v1.
- Sign-up should be invite-only (turn off public sign-ups in Supabase Auth settings, invite family by email).

## Code (built 2026-11-01)
- `index.html`, `css/style.css`, `js/`: `questions.js` (the text), `logic.js` (pure rules, tested in `tests/logic.test.mjs`), `supabase.js` (plain fetch, no library), `app.js` (login, form, thank-you).
- Login: emailed link or 6-digit code, `create_user:false` so only invited people get in. Needs Supabase dashboard setup (see STATE.md next steps).
- Saved answer shapes, keyed by question number: single = text; multi (1, 3, 11, 16, 17) = `{choices: [...], other: "..."}`; top3 (5) = array of 3; text (18, 19) = text; q2 = array of 3 titles.
- Only the name is required; question 5 must be exactly three if touched. People can re-open and edit their answers.
