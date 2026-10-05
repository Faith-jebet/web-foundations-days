let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];


// 1. searchNotes()

function searchNotes(word) {
    const searchWord = word.toLowerCase();

    return notes.filter(note =>
        note.text.toLowerCase().includes(searchWord)
    );
}


// 2. longestNote()
// Returns the note with the most characters.
// Returns null if there are no notes.
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    let longest = notes[0];

    for (let note of notes) {
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    return longest;
}


// 3. countByCategory()

function countByCategory() {
    const counts = {};

    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;
        }
    }

    return counts;
}


// 4. getSummary()
function getSummary() {
    const counts = countByCategory();
    const total = notes.length;
    const word = total === 1 ? "note" : "notes";

    return `${total} ${word}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}


// 5. isDuplicate()

function isDuplicate(text) {
    const cleanedText = text.trim().toLowerCase();

    return notes.some(note =>
        note.text.trim().toLowerCase() === cleanedText
    );
}


// 6. addNote()

function addNote(text, category) {

    const cleanedText = text.trim();
    const cleanedCategory = category.trim().toLowerCase();

    if (cleanedText.length < 1 || cleanedText.length > 200) {
        console.log("Note was not added: text must be between 1 and 200 characters.");
        return false;
    }

    if (isDuplicate(cleanedText)) {
        console.log("Note was not added: a note with the same text already exists.");
        return false;
    }

    // Check category
    const validCategories = ["personal", "work", "study"];

    if (!validCategories.includes(cleanedCategory)) {
        console.log("Note was not added: category must be personal, work, or study.");
        return false;
    }

    // Create the new note
    const newNote = {
        id: notes.length > 0 ? notes[notes.length - 1].id + 1 : 1,
        text: cleanedText,
        category: cleanedCategory
    };

    notes.push(newNote);

    console.log("Note added successfully:", newNote);

    return true;
}

// searchNotes()
console.log(searchNotes("javascript"));

console.log(searchNotes("EMAIL"));

console.log(searchNotes("football"));


// longestNote()
console.log(longestNote());

const savedNotes = notes;
notes = [];

console.log(longestNote());

notes = savedNotes;


// countByCategory()
console.log(countByCategory());

console.log(countByCategory().personal);


// getSummary()
console.log(getSummary());

notes = [
    {id: 1, text: "Study javascript", category: "study"},
];

console.log(getSummary());

//restore original notes
notes = savedNotes;


// isDuplicate()
console.log(isDuplicate("Call mum"));

console.log(isDuplicate("  CALL MUM  "));

console.log(isDuplicate("Go shopping"));


// addNote()
console.log(addNote("Prepare for the JavaScript test", "study"));

console.log(addNote("Call mum", "personal"));

console.log(addNote("Buy a new laptop", "shopping"));

console.log(addNote("", "personal"));

console.log("Final notes:");
console.log(notes);