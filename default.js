// WORDIFICATOR-9000 - A word game helper
// (c) 2022 Bertrand Le Roy

'use strict'

function loadTries(wordList) {
    const tries = [];
    for (let word of wordList.split(/\W/)) {
        const wordLength = word.length;
        if (wordLength <= 1) continue;
        let node = tries[wordLength] || (tries[wordLength] = {});
        for (let i = 0; i < wordLength; i++) {
            const char = word.charAt(i);
            node = node[char] || (node[char] = {});
        }
    }
    return tries;
}

function* nextNodes(word, node, letters, remainingLetters) {
    if (remainingLetters) {
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            if (i > 0 && letter === letters[i - 1]) continue;
            if (node[letter]) {
                for (let nextNode of nextNodes(
                    word + letter,
                    node[letter],
                    letters.slice(0, i).concat(letters.slice(i + 1)),
                    remainingLetters - 1
                    )) {
                    yield nextNode;
                }
            }
        }
    } else {
        yield { word: word, node: node };
    }
}

function* words(pattern, trieNode, i = 0, word = "") {
    if (i >= pattern.length) return;
    const nugget = pattern[i];
    let remainingLetters = nugget.length;
    let letters = nugget.letters;
    for (let node of nextNodes(word, trieNode, letters, remainingLetters)) {
        if (i + 1 >= pattern.length) {
            yield node.word;
        } else {
            for (let word of words(pattern, node.node, i + 1, node.word)) {
                yield word;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', e => {
    let tries;
    const req = new XMLHttpRequest();
    req.addEventListener("load", () => {
        const wordList = req.responseText.toLowerCase();
        tries = loadTries(wordList);
    });
    req.open("GET", "./assets/words.txt");
    req.send();

    const patternTextbox = document.getElementById("pattern-textbox");
    const searchButton = document.getElementById("search-button");
    const clearButton = document.getElementById("clear-button");
    const resultList = document.getElementById("result-list");
    const spinner = document.getElementById("spinner");
    
    const findWords = () => {
        searchButton.disabled = true;
        spinner.style.opacity = 1;
        const pattern = patternTextbox.value
            .toLowerCase()
            .split(/\s/)
            .map(line => {
                const split = line.split(':');
                if (split.length === 2) {
                    return {
                        length: parseInt(split[0], 10),
                        letters: [...split[1]].sort()
                    };
                }
                else {
                    return {
                        length: line.length,
                        letters: [...line].sort()
                    };
                }
            });
        resultList.innerHTML = "";
        const wordLength = pattern.reduce((p, v) => p + v.length, 0);
        let trieNode = tries[wordLength];
        if (trieNode)
        {
            for (let word of words(pattern, trieNode)) {
                const li = document.createElement("li");
                li.innerText = word;
                resultList.appendChild(li);
            }
        }
        spinner.style.opacity = 0;
        searchButton.disabled = false;
    };

    searchButton.addEventListener("click", () => {
        history.pushState(patternTextbox.value, "");
        findWords();
        patternTextbox.focus();
    });

    clearButton.addEventListener("click", () => {
        patternTextbox.value = "";
        patternTextbox.focus();
    });

    window.onpopstate = e => {
        patternTextbox.value = e.state;
        findWords();
        patternTextbox.focus();
    };

    patternTextbox.focus();
});
