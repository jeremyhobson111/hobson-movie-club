// The survey text. Final wording from docs/areas/survey.md: do not reword without asking.
// type: multi = select all that apply, single = pick one, top3 = pick exactly three, text = free text.
// `other: true` adds an "Other" text box. `exclusive` lists options that clear all the others.

export const INTRO = [
  "The Hobson Movie Club is making a comeback! This time we want a wider variety than just Oscar nominees: member favorites, genres, highly rated films, hidden gems and classics.",
  "Your input on how the club should work matters, so please take a few minutes. Plan: one movie per week.",
];
export const SIGN_OFF = "Dave";

export const CLOSING = [
  "Thanks for taking the time to share your thoughts!",
  "The goal is to bring the family together, discover great movies, share opinions, have friendly debates, and make memories.",
];

export const QUESTIONS = [
  { id: 1, type: "multi", other: true, text: "What movie genres do you enjoy watching?",
    options: ["Action", "Comedy", "Drama", "Thriller / Suspense", "Horror", "Science Fiction", "Fantasy", "Adventure", "Mystery / Crime", "Romance", "Documentary", "Animation", "Musical", "Sports", "War / History", "Western"] },
  { id: 2, type: "text3", text: "What are your TOP 3 all-time favorite movies?" },
  { id: 3, type: "multi", other: true, exclusive: ["None, I'm open to anything!"], text: "Any genres you would prefer NOT to watch?",
    options: ["Horror", "Romance", "Musicals", "War movies", "Documentaries", "Foreign-language films", "None, I'm open to anything!"] },
  { id: 4, type: "single", text: "How open are you to watching movies you have never heard of?",
    options: ["Very open", "Somewhat open (depending on the description)", "Not very open (prefer familiar)", "I would rather stick with movies I know I'll enjoy"] },
  { id: 5, type: "top3", text: "Which THREE movie club formats sound most appealing?",
    options: ["Member Favorites", "Genre of the Month", "Rotten Tomatoes Challenge", "80s to Today", "Hidden Gems", "Classic Movies", "Random Selection", "Themed Nights", "Member's Choice", "Combination"] },
  { id: 6, type: "single", text: "How important should Rotten Tomatoes ratings be?",
    options: ["Only 90%+ on BOTH Tomatometer and Popcornmeter", "90%+ on EITHER", "80%+ on EITHER", "Ratings should be a guide, not a restriction", "Ratings don't matter to me"] },
  { id: 7, type: "single", text: "What movie decades would you most like to explore?",
    options: ["1980s and newer", "1990s and newer", "2000s and newer", "1970s and newer", "1960s and newer", "Any decade"] },
  { id: 8, type: "single", text: "Should members be able to submit their own favorites to the selection pool?",
    options: ["Absolutely!", "Yes, occasionally", "Maybe, depending on the movie", "No preference"] },
  { id: 9, type: "single", text: "How often would you realistically participate?",
    options: ["Every week", "Every two weeks", "Once a month", "Whenever my schedule allows"] },
  { id: 10, type: "single", text: "How should we decide who selects or introduces the weekly movie?",
    options: ["Randomly select a family member each week", "Rotate through family members", "Randomly draw from the submitted movie list", "Have one person manage all selections", "A combination of these methods"] },
  { id: 11, type: "multi", exclusive: ["All of the above!"], text: "What did you enjoy MOST about the original club?",
    options: ["Reason to get together as a family", "Anticipation of finding out the movie", "Discovering movies I might not have watched", "Sharing our opinions", "The friendly debates and disagreements", "Rating and voting on the movies", "Comparing everyone's ratings", "All of the above!"] },
  { id: 12, type: "single", text: "How important is it that members share opinions, discuss, and vote?",
    options: ["Very important", "Somewhat important", "I enjoy it, but it's not necessary", "I mainly want to watch the movies"] },
  { id: 13, type: "single", text: "Would you enjoy a group discussion after everyone has watched the weekly movie?",
    options: ["Yes! I would love that", "Maybe, depending on the movie", "Occasionally", "No, I prefer to watch on my own"] },
  { id: 14, type: "single", text: "Interested in occasionally revisiting movies some members have already seen?",
    options: ["Absolutely", "Yes, but only occasionally", "I'd rather stick with movies I haven't seen", "No preference"] },
  { id: 15, type: "single", text: "Would you enjoy an annual FAMILY MOVIE CLUB HALL OF FAME?",
    options: ["Absolutely!", "Maybe", "Not particularly"] },
  { id: 16, type: "multi", text: "What awards would you like at the end of each year?",
    options: ["Best Overall Movie", "Best Comedy", "Best Action Movie", "Best Drama", "Best Classic Movie", "Biggest Surprise", "Most Divisive Movie", "Most Rewatchable Movie", "Worst Movie of the Year", "Family Favorite / People's Choice"] },
  { id: 17, type: "multi", exclusive: ["All of the above!"], text: "What would make you MOST excited about participating again?",
    options: ["Better movie selections", "More variety", "More interaction with family", "Friendly competition and voting", "Flexibility to participate when I can", "Fun themes, challenges, and annual awards", "All of the above!"] },
  { id: 18, type: "text", text: "What is ONE thing the club MUST include to be successful?" },
  { id: 19, type: "text", text: "Any other ideas, suggestions, or changes?" },
];
