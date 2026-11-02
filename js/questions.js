// The survey text. Version 2, approved by the owner 2026-11-02 (draft: docs/areas/survey-v2-draft.md).
// type: multi = select all that apply, single = pick one, text = free text, text3 = three text boxes.
// `other: true` adds an "Other" text box. `exclusive` lists options that clear all the others.

export const INTRO = [
  "Hobson Movie Club is coming back, this time as an app on your phone!",
  "The old way: each week a random year from 1960 on was picked, we saw that year's Best Picture nominees, the next member in the rotation chose one, we watched it and rated it out of 5 stars, then everyone's ratings were revealed.",
  "Before we build the new version we want to know what worked and what didn't. It takes about 3 minutes, and every question is optional except your name.",
];

export const CLOSING = [
  "Thanks for taking the time to share your thoughts!",
  "The goal is to bring the family together, discover great movies, share opinions, have friendly debates, and make memories.",
];

const GENRES = ["Action", "Comedy", "Drama", "Thriller / Suspense", "Horror", "Science Fiction", "Fantasy", "Adventure", "Mystery / Crime", "Romance", "Documentary", "Animation", "Musical", "Sports", "War / History", "Western"];

export const QUESTIONS = [
  { id: 1, type: "multi", other: true, text: "What movie genres do you enjoy watching?", options: GENRES },
  { id: 2, type: "multi", other: true, exclusive: ["None, I'm open to anything!"], text: "Any genres you would prefer NOT to watch?",
    options: ["Horror", "Romance", "Musicals", "War movies", "Documentaries", "Foreign-language films", "None, I'm open to anything!"] },
  { id: 3, type: "text3", text: "What are your TOP 3 all-time favorite movies?" },
  { id: 4, type: "single", text: "How open are you to watching movies you have never heard of?",
    options: ["Very open", "Somewhat open (depending on the description)", "Not very open (prefer familiar)", "I would rather stick with movies I know I'll enjoy"] },
  { id: 5, type: "multi", text: "What did you enjoy MOST about the old club?",
    options: ["Reason to get together as a family", "Not knowing what the movie would be", "Discovering movies I'd never have watched", "Choosing from the list when it was my turn", "Rating the movie", "Seeing everyone's ratings", "The debates and disagreements"] },
  { id: 6, type: "single", text: "How often did you actually watch the week's movie?",
    options: ["Almost every week", "About half the weeks", "Only now and then", "Hardly ever"] },
  { id: 7, type: "multi", other: true, text: "What usually got in the way?",
    options: ["Not enough time", "The movie didn't interest me", "I forgot", "Couldn't easily find or watch it", "Nothing happened if I skipped it"] },
  { id: 8, type: "single", text: "How often would you realistically take part now?",
    options: ["Every week", "Every two weeks", "Once a month", "Whenever my schedule allows"] },
  { id: 9, type: "single", text: "Would you like a points game? Points for watching and rating, plus bonus points when others rate your pick highly.",
    options: ["Love it", "Sounds fun", "Don't care either way", "I'd rather not have scoring"] },
  { id: 10, type: "multi", other: true, exclusive: ["Nothing, the points are enough"], text: "What should the points winner get?",
    options: ["Bragging rights", "Pick the next movie night's theme", "A small cash pot everyone chips into", "Their name in a hall of fame", "Nothing, the points are enough"] },
  { id: 11, type: "single", text: "Would you install the club on your phone and get notifications (your turn to pick, ratings due, results are in)?",
    options: ["Yes, and I'd like all of them", "Yes, but only a few notifications", "I'd rather get a text or email", "No thanks"] },
  { id: 12, type: "text", text: "What must the club do to work this time?" },
  { id: 13, type: "text", text: "Any other ideas or changes?" },
];
