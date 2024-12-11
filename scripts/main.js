"use strict";

//#region Variables
const ELEM_BODY = document.querySelector("body");

// Get colors from css
const COLOR_BACKGROUND = getComputedStyle(document.documentElement).getPropertyValue("--color-background");
const COLOR_TEXT = getComputedStyle(document.documentElement).getPropertyValue("--color-text");
const COLOR_TEXT_INVERTED = getComputedStyle(document.documentElement).getPropertyValue("--color-text-inverted");
const FILTER_IMG = getComputedStyle(document.documentElement).getPropertyValue("--filter-img");
const FILTER_WHITE = getComputedStyle(document.documentElement).getPropertyValue("--filter-white");
const FILTER_BLACK = getComputedStyle(document.documentElement).getPropertyValue("--filter-black");
const COLOR_IMG = getComputedStyle(document.documentElement).getPropertyValue("--color-img");
const COLOR_POPUP = getComputedStyle(document.documentElement).getPropertyValue("--color-popup");
const COLOR_BTN_HOVER = getComputedStyle(document.documentElement).getPropertyValue("--color-btn-hover");
const COLOR_OVERLAY = getComputedStyle(document.documentElement).getPropertyValue("--color-overlay");
const COLOR_UNLEARNED = getComputedStyle(document.documentElement).getPropertyValue("--color-unleaned");
const COLOR_LEARNING = getComputedStyle(document.documentElement).getPropertyValue("--color-learning");
const COLOR_FINISHED = getComputedStyle(document.documentElement).getPropertyValue("--color-finished");

const ELEM_EDITALG_CONTAINER = document.getElementById("editalg-container");
const ELEM_EDITALG_IMG = document.getElementById("editalg-img");
const ELEM_EDITALG_LIST = document.getElementById("editalg-list");
const ELEM_EDITALG_CUSTOMALG = document.getElementById("editalg-customalg");
const ELEM_EDITALG_LISTENTRY = [];

let selectedCase = 0;
let selectedAlgNumber = 0;

// Maximum number of algs per Case
const NUM_ALG = 20;
const COLORS_ALG = ["transparent", "#009900"];

const ELEM_WINDOW_SELECT = document.getElementById("window-select");
const ELEM_WINDOW_TRAIN = document.querySelector(".window-train");

const ELEM_GROUP_CONTAINER = Array(GROUPS.length);
const ELEM_SIDE_CONTAINER = document.getElementById("side-container");
const ELEM_BTN_CHANGE_MODE = document.getElementById("change-mode");
const ELEM_OVERLAY = document.getElementById("overlay");
const ELEM_WELCOME_CONATINER = document.getElementById("welcome-container");
const ELEM_WELCOME_CONATINER_TRAIN = document.getElementById("welcome-container-train");
const ELEM_INFO_CONTAINER = document.getElementById("info-container");
const ELEM_LOADING_SCREEN = document.getElementById("loading-screen");
const ELEM_CHANGE_STATE_POPUP = document.getElementById("popup-change-state");
const ELEM_FEEDBACK_CONTAINER = document.getElementById("feedback-container");
const ELEM_DIALOGS = document.querySelectorAll("dialog");

const CATEGORY_NAMES = ["Unlearned", "Learning", "Finished", "All"];

const CATEGORY_COLORS = [COLOR_UNLEARNED, COLOR_LEARNING, COLOR_FINISHED];
const CATEGORY_BORDERS = ["solid", "solid", "solid"];
const CATEGORY_TEXT_COLOR = [COLOR_TEXT, COLOR_TEXT_INVERTED, COLOR_TEXT_INVERTED];
const COLORS_BTN_EDIT = [FILTER_IMG, FILTER_BLACK, FILTER_BLACK];

const IMG_PATH_RIGHT_ARROW = "./images/arrow_collapse_right.svg";
const IMG_PATH_DOWN_ARROW = "./images/arrow_collapse_down.svg";
const IMG_PATH_CHANGE_LEARNING_STATE = "./images/change_learning_state.svg";
const IMG_PATH_CHANGE_LEARNING_STATE_HOLLOW = "./images/change_learning_state_hollow.svg";

const ELEM_LABEL_CHOOSE_GROUP = document.querySelector(".acessibility-label");
const ELEM_CONTAINER_SELECT_GROUP = document.querySelector(".container-select-group");

const ELEM_CHECKBOX_UNLEARNED = document.getElementById("checkboxUnlearnedId");
const ELEM_CHECKBOX_LEARNING = document.getElementById("checkboxLearningId");
const ELEM_CHECKBOX_FINISHED = document.getElementById("checkboxFinishedId");

const ELEM_CHECKBOX_BASIC = document.getElementById("checkboxGroupBasicId");
const ELEM_CHECKBOX_BASIC_BACK = document.getElementById("checkboxGroupBasicBackId");
const ELEM_CHECKBOX_ADVANCED = document.getElementById("checkboxGroupAdvancedId");
const ELEM_CHECKBOX_EXPERT = document.getElementById("checkboxGroupExpertId");

const SIZE_BTN_CHANGE_LEARNING_STATE_SMALL = "1.2rem";
const SIZE_BTN_CHANGE_LEARNING_STATE_BIG = "1.7rem";

const ELEM_CHECKBOX_LEFT = document.getElementById("checkboxLeftId");
const ELEM_CHECKBOX_RIGHT = document.getElementById("checkboxRightId");

const ELEM_CHECKBOX_AUF = document.getElementById("checkboxAUFId");

const ELEM_SELECT_HINT_IMAGE = document.getElementById("select-hint-image");
const ELEM_SELECT_HINT_ALG = document.getElementById("select-hint-alg");

const ELEM_CHECKBOX_TIMER_ENABLE = document.getElementById("checkboxEnableTimerId");

const ELEM_BUTTON_SETTINGS = document.querySelector(".btn-settings-train");
const ELEM_CONTAINER_TRAIN_SETTINGS = document.getElementById("train-settings-container");

const ELEM_SCRAMBLE = document.getElementById("scramble");
const ELEM_HINT_CONTAINER = document.getElementById("hint-container");
const ELEM_HINT_PLACEHOLDER = document.getElementById("hint-placeholder");
const ELEM_HINT_IMG = document.getElementById("hint-img");
const ELEM_DIV_HINT_IMG = document.querySelector(".div-hint-img");

let algHint = "";

const ELEM_DIV_TWISTY_PLAYER = document.querySelector(".div-twisty-player");
const ELEM_TWISTY_PLAYER = document.querySelector("twisty-player");
const ELEM_BTN_RESET_PLAYER_VIEW = document.querySelector(".btn-reset-player-view");
// document.body.append(new TwistyAlgViewer({ twistyPlayer: ELEM_TWISTY_PLAYER }));
// console.log("TwistyAlgViewer: " + TwistyAlgViewer);

const ELEM_RADIO_UNLEARNED = document.getElementById("radio-state-unlearned");
const ELEM_RADIO_LEARNING = document.getElementById("radio-state-learning");
const ELEM_RADIO_FINISHED = document.getElementById("radio-state-finished");
let currentTrainGroup = -1;
let currentTrainCase = -1;

let selectedTrainIndex = 0;
let hintCounter = 0;

let mode = 0; // 0: select, 1: train

// List that contains all the randomly selected cases
let trainCaseList = [];
let currentTrainCaseNumber = -1;

// Basic, Basic Back, Advanced, Exert
const ELEM_SELECT_GROUP = document.getElementById("select-group-id");

let boolShowDebugInfo = true;
const ELEM_BTN_SHOW_HIDE_DEBUG_INFO = document.getElementById("btn-show-hide-debug-info");
const ELEM_DEBUG_INFO = document.getElementById("debug-info");

let generatedScrambles = [];

// Flag is set when data is saved
let flagSave = false;

let flagdoublepress = false;

const STRING_MIRRORED = ["Right", "Left"];

const ELEM_LOADING_CASE = document.getElementById("loading-case");

const CLASS_DISPLAY_NONE = "display-none";

// Timer
const ELEM_TIMER = document.getElementById("timer");
let flagTimerRunning;
let second = 0;
let count = 0;

let spacePressFlag = false;
const ELEM_PRESS_ME_TRAIN = document.getElementById("div-press-me-tain-id");

let divPressMe;

const ELEM_INPUT_EXPORT = document.getElementById("input-export");

let mousepositionLast = [0, 0];

const ELEM_BTN_CHANGE_ALG = document.getElementById("btn-change-alg-id");

const ELEM_FEEDBACK_NAME = document.getElementById("feedback-name-id");

const ELEM_IFRAME_VIDEO = document.getElementById("iframe-video");
const ELEM_THUMBNAIL_BUTTON = document.getElementById("thumbnail-button");
//#endregion

// ----------------------------------------- LOADING -------------------------------------------------------
window.addEventListener("load", () => {
  importLocalStorage();
  loadUserData();
  localStorage.clear();
  saveUserData();

  // Set Group to show
  ELEM_SELECT_GROUP.selectedIndex = viewSelection;

  showWelcomePopup();
  // Create all Entries
  addElementsToDOM();

  showPressMeText();
  hidePressMeTrainText();

  highlightAllBulkChangeTrainingStateButtons();

  // Generate placeholder for algs to select in Edit Algorithm Pop Up
  for (let i = 0; i < NUM_ALG; i++) {
    ELEM_EDITALG_LISTENTRY.push(document.createElement("div"));
    ELEM_EDITALG_LISTENTRY[i].classList.add("editalg-listentry");
    ELEM_EDITALG_LISTENTRY[i].onclick = function () {
      // Change Background when selected
      let indexGroup;
      if (!mode) {
        indexGroup = ELEM_SELECT_GROUP.selectedIndex;
      } else {
        indexGroup = generatedScrambles[currentTrainCaseNumber].indexGroup;
      }
      if (selectedAlgNumber < GROUPS[indexGroup].algorithms[selectedCase + 1].length) {
        ELEM_EDITALG_LISTENTRY[selectedAlgNumber].style.background = COLORS_ALG[0];
      } else {
        ELEM_EDITALG_CUSTOMALG.style.background = COLORS_ALG[0];
      }
      ELEM_EDITALG_LISTENTRY[i].style.background = COLORS_ALG[1];
      selectedAlgNumber = i;
    };

    ELEM_EDITALG_LIST.appendChild(ELEM_EDITALG_LISTENTRY[i]);
  }

  // Close dialogs (popup-container) if clicked outside the dialog
  ELEM_DIALOGS.forEach((elem_dialog) => {
    elem_dialog.addEventListener("mousedown", function (event) {
      // Don't close if the click is on a select element or its options
      if (event.target.tagName === "SELECT" || event.target.tagName === "OPTION") {
        return;
      }

      var rect = elem_dialog.getBoundingClientRect();
      var isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        closeOverlays();
      }
    });
  });

  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);

  ELEM_HINT_IMG.addEventListener("load", function () {
    ELEM_HINT_IMG.style.opacity = "1";
    ELEM_LOADING_CASE.classList.add(CLASS_DISPLAY_NONE);
  });

  // Run this function to only show basic cases in the beginning
  showSelectedGroup();

  // Hide Loading Screen after some time
  // setTimeout(() => {
  //   ELEM_LOADING_SCREEN.style.display = "none";
  // }, 100);
  ELEM_LOADING_SCREEN.style.display = "none";

  /*ELEM_SELECT_GROUP.classList.add("animation-blink");
  window.setTimeout(function () {
    ELEM_SELECT_GROUP.classList.remove("animation-blink");
  }, 2300);*/
});

/**
 * Creates all necessary elements in the DOM for the case selection page.
 * Called when the page is loaded.
 */
function addElementsToDOM() {
  // Iterate over all groups (basic, basic back, advanced, expert)
  for (let indexGroup = 0; indexGroup < GROUPS.length; indexGroup++) {
    const GROUP = GROUPS[indexGroup];
    ELEM_GROUP_CONTAINER[indexGroup] = document.createElement("div");
    ELEM_GROUP_CONTAINER[indexGroup].classList.add("group-container");

    // Iterate over all categories (basic inserts, pieces on top/white facing..., ...)
    for (let indexCategory = 0; indexCategory < GROUP.categoryCases.length; indexCategory++) {
      let categoryItems = GROUP.categoryCases[indexCategory];
      GROUP.categoryContainer[indexCategory] = document.createElement("div");
      GROUP.categoryContainer[indexCategory].classList.add("category-container");
      GROUP.categoryContainer[indexCategory].id = "expand-contract-group" + indexGroup + "-category" + indexCategory;
      GROUP.collapseContainer.push(document.createElement("button"));
      GROUP.collapseContainer[indexCategory].type = "button";
      GROUP.collapseContainer[indexCategory].classList.add("collapse-container");

      GROUP.categoryCollapseImg.push(document.createElement("img"));
      GROUP.categoryCollapseImg[indexCategory].classList.add("img-collapse-category");
      GROUP.categoryCollapseImg[indexCategory].alt = "collapse category";
      GROUP.categoryCollapseImg[indexCategory].onclick = function () {
        collapseCategory(indexGroup, indexCategory);
      };

      GROUP.categoryCollapseImg[indexCategory].src = IMG_PATH_RIGHT_ARROW;
      if (GROUP.collapse[indexCategory]) {
        GROUP.categoryContainer[indexCategory].classList.add("display-none");
      } else {
        GROUP.categoryCollapseImg[indexCategory].classList.add("rotate-arrow");
      }

      GROUP.headingCategoryName.push(document.createElement("h2"));
      GROUP.headingCategoryName[indexCategory].classList.add("heading-category-name");
      GROUP.headingCategoryName[indexCategory].innerHTML = GROUP.categoryNames[indexCategory];
      GROUP.headingCategoryName[indexCategory].onclick = function () {
        collapseCategory(indexGroup, indexCategory);
      };

      GROUP.btnChangeLearningState[0].push(document.createElement("img"));
      GROUP.btnChangeLearningState[0][indexCategory].title = "Change state to Unlearned";
      GROUP.btnChangeLearningState[0][indexCategory].classList.add("btn-change-learing-state");
      GROUP.btnChangeLearningState[0][indexCategory].classList.add("filter-unlearned");
      GROUP.btnChangeLearningState[0][indexCategory].src = IMG_PATH_CHANGE_LEARNING_STATE_HOLLOW;
      GROUP.btnChangeLearningState[0][indexCategory].onclick = function () {
        changeLearningStateBulk(indexGroup, indexCategory, 0);
      };
      GROUP.btnChangeLearningState[1].push(document.createElement("img"));
      GROUP.btnChangeLearningState[1][indexCategory].title = "Change state to Learning";
      GROUP.btnChangeLearningState[1][indexCategory].classList.add("btn-change-learing-state");
      GROUP.btnChangeLearningState[1][indexCategory].classList.add("filter-learning");
      GROUP.btnChangeLearningState[1][indexCategory].src = IMG_PATH_CHANGE_LEARNING_STATE;
      GROUP.btnChangeLearningState[1][indexCategory].onclick = function () {
        changeLearningStateBulk(indexGroup, indexCategory, 1);
      };
      GROUP.btnChangeLearningState[2].push(document.createElement("img"));
      GROUP.btnChangeLearningState[2][indexCategory].title = "Change state to Finished";
      GROUP.btnChangeLearningState[2][indexCategory].classList.add("btn-change-learing-state");
      GROUP.btnChangeLearningState[2][indexCategory].classList.add("filter-finished");
      GROUP.btnChangeLearningState[2][indexCategory].src = IMG_PATH_CHANGE_LEARNING_STATE;
      GROUP.btnChangeLearningState[2][indexCategory].onclick = function () {
        changeLearningStateBulk(indexGroup, indexCategory, 2);
      };

      GROUP.collapseContainer[indexCategory].appendChild(GROUP.categoryCollapseImg[indexCategory]);
      GROUP.collapseContainer[indexCategory].appendChild(GROUP.headingCategoryName[indexCategory]);
      GROUP.collapseContainer[indexCategory].appendChild(GROUP.btnChangeLearningState[0][indexCategory]);
      GROUP.collapseContainer[indexCategory].appendChild(GROUP.btnChangeLearningState[1][indexCategory]);
      GROUP.collapseContainer[indexCategory].appendChild(GROUP.btnChangeLearningState[2][indexCategory]);
      ELEM_GROUP_CONTAINER[indexGroup].appendChild(GROUP.collapseContainer[indexCategory]);

      // Iterate over every case in category
      for (let indexCategoryItem = 0; indexCategoryItem < categoryItems.length; indexCategoryItem++) {
        let indexCase = categoryItems[indexCategoryItem] - 1;
        // Check if selected algorithm is valid
        if (GROUP.algorithms[indexCase + 1] == undefined) {
          console.warn("Trying to access invalid Case\nindexGroup: " + indexGroup + "\nindexCase: " + indexCase);
          continue;
        }
        // Case Selection Page
        const IMG_CASE_PATH = GROUP.imgPath + "right/F2L" + (indexCase + 1) + ".svg";

        GROUP.divContainer[indexCase] = document.createElement("div");
        GROUP.divContainer[indexCase].classList.add("case-container");
        GROUP.divContainer[indexCase].style.background = CATEGORY_COLORS[GROUP.caseSelection[indexCase]];
        GROUP.divContainer[indexCase].style.color = CATEGORY_TEXT_COLOR[GROUP.caseSelection[indexCase]];
        GROUP.divContainer[indexCase].style.borderStyle = CATEGORY_BORDERS[GROUP.caseSelection[indexCase]];

        GROUP.caseNumber[indexCase] = document.createElement("div");
        GROUP.caseNumber[indexCase].classList.add("case-number");

        GROUP.imgContainer[indexCase] = document.createElement("button");
        GROUP.imgContainer[indexCase].classList.add("img-case-container");
        GROUP.imgContainer[indexCase].onclick = function () {
          changeState(indexGroup, indexCategory, indexCase);
        };

        GROUP.imgCase[indexCase] = document.createElement("img");
        GROUP.imgCase[indexCase].classList.add("img-case");

        GROUP.algorithm[indexCase] = document.createElement("div");
        GROUP.algorithm[indexCase].classList.add("algorithm");

        GROUP.btnContainer[indexCase] = document.createElement("div");
        GROUP.btnContainer[indexCase].classList.add("btn-container");

        // Edit
        GROUP.btnEdit[indexCase] = document.createElement("div");
        GROUP.btnEdit[indexCase].classList.add("btn-edit");
        GROUP.btnEdit[indexCase].title = "Edit";

        GROUP.imgEdit[indexCase] = document.createElement("img");
        GROUP.imgEdit[indexCase].classList.add("img-edit-trash");
        GROUP.imgEdit[indexCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]];
        GROUP.imgEdit[indexCase].alt = "edit case " + (indexCase + 1);
        GROUP.imgEdit[indexCase].onclick = function () {
          editAlgs(indexGroup, indexCase);
        };

        // Mirror
        GROUP.btnMirror[indexCase] = document.createElement("div");
        GROUP.btnMirror[indexCase].classList.add("btn-edit");
        GROUP.btnMirror[indexCase].title = "Mirror";

        GROUP.imgMirror[indexCase] = document.createElement("img");
        GROUP.imgMirror[indexCase].classList.add("img-edit-trash");
        GROUP.imgMirror[indexCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]];
        GROUP.imgMirror[indexCase].alt = "mirror case " + (indexCase + 1);
        GROUP.imgMirror[indexCase].onclick = function () {
          mirrorCase(indexGroup, indexCase);
        };

        GROUP.divAlgorithm[indexCase] = document.createElement("div");
        GROUP.divAlgorithm[indexCase].classList.add("div-algorithm");

        GROUP.caseNumber[indexCase].innerHTML = indexCase + 1;
        GROUP.imgCase[indexCase].src = IMG_CASE_PATH;
        GROUP.imgCase[indexCase].alt = GROUP.name + ", Case " + (indexCase + 1);
        GROUP.imgCase[indexCase].loading = "lazy";

        // Set shown alg
        if (GROUP.algorithmSelection[indexCase] < GROUP.algorithms[indexCase + 1].length) {
          GROUP.divAlgorithm[indexCase].innerHTML =
            GROUP.algorithms[indexCase + 1][GROUP.algorithmSelection[indexCase]];
        } else {
          GROUP.divAlgorithm[indexCase].innerHTML = GROUP.customAlgorithms[indexCase];
        }

        GROUP.imgMirror[indexCase].src = "./images/mirror1.svg";
        GROUP.imgEdit[indexCase].src = "./images/edit.svg";

        GROUP.divContainer[indexCase].style.background = CATEGORY_COLORS[GROUP.caseSelection[indexCase]];

        GROUP.divContainer[indexCase].appendChild(GROUP.caseNumber[indexCase]); // Don't show case number

        GROUP.divContainer[indexCase].appendChild(GROUP.imgContainer[indexCase]);
        GROUP.imgContainer[indexCase].appendChild(GROUP.imgCase[indexCase]);
        GROUP.divContainer[indexCase].appendChild(GROUP.algorithm[indexCase]);
        GROUP.algorithm[indexCase].appendChild(GROUP.divAlgorithm[indexCase]);
        GROUP.algorithm[indexCase].appendChild(GROUP.btnContainer[indexCase]);
        GROUP.btnContainer[indexCase].appendChild(GROUP.btnEdit[indexCase]);
        GROUP.btnContainer[indexCase].appendChild(GROUP.btnMirror[indexCase]);
        GROUP.btnEdit[indexCase].appendChild(GROUP.imgEdit[indexCase]);
        GROUP.btnMirror[indexCase].appendChild(GROUP.imgMirror[indexCase]);

        GROUP.categoryContainer[indexCategory].appendChild(GROUP.divContainer[indexCase]);
      }
      ELEM_GROUP_CONTAINER[indexGroup].appendChild(GROUP.categoryContainer[indexCategory]);
    }
    ELEM_WINDOW_SELECT.appendChild(ELEM_GROUP_CONTAINER[indexGroup]);
  }
}

/**
 * Updates the shown algorithm in the selection window and the generatedScrambles array.
 * If in train mode, also updates the Twisty Player's algorithm and reset the progressbar.
 * Saves the user data afterwards.
 * Called when user clicks on Confirm in the Change Alg popup.
 */
function updateAlg() {
  let indexGroup;
  if (!mode) {
    indexGroup = ELEM_SELECT_GROUP.selectedIndex;
  } else {
    indexGroup = generatedScrambles[currentTrainCaseNumber].indexGroup;
  }
  const GROUP = GROUPS[indexGroup];

  let tempAlg = "";

  // Read text in custom Alg Textbox
  GROUP.customAlgorithms[selectedCase] = ELEM_EDITALG_CUSTOMALG.value;
  // Check if selected alg is default or custom
  if (selectedAlgNumber < GROUP.algorithms[selectedCase + 1].length) {
    // If selected Alg is default
    tempAlg = GROUP.algorithms[selectedCase + 1][selectedAlgNumber];
  } else {
    // If selected Alg is custom
    tempAlg = GROUP.customAlgorithms[selectedCase];
  }

  if (tempAlg == "") return;

  if (GROUP.flagMirrored[selectedCase] == true) tempAlg = mirrorAlg(tempAlg);

  // Display algorithm in selection window
  GROUP.divAlgorithm[selectedCase].innerHTML = tempAlg;

  // Save which Alg was selected
  GROUP.algorithmSelection[selectedCase] = selectedAlgNumber;

  if (currentTrainCaseNumber >= 0 && mode == 1) {
    const CURRENT_TRAIN_CASE = generatedScrambles[currentTrainCaseNumber];
    if (!CURRENT_TRAIN_CASE.mirroring) {
      generatedScrambles[currentTrainCaseNumber].algHint = tempAlg;
      ELEM_TWISTY_PLAYER.alg = tempAlg;
    } else {
      generatedScrambles[currentTrainCaseNumber].algHint = mirrorAlg(tempAlg);
      ELEM_TWISTY_PLAYER.alg = mirrorAlg(tempAlg);
    }
  }

  // Reset Twisty Player progressbar
  ELEM_TWISTY_PLAYER.timestamp = 0;

  closeOverlays();

  // Save
  saveUserData();
}

/**
 * Handles the "Edit Alg" button click event in train mode.
 * Blurs the button and retrieves the current group and case indices
 * from the generated scrambles array, then calls editAlgs to
 * initiate the algorithm editing process.
 */
function editCurrentAlg() {
  ELEM_BTN_CHANGE_ALG.blur();
  const INDEX_GROUP = generatedScrambles[currentTrainCaseNumber].indexGroup;
  const INDEX_CASE = generatedScrambles[currentTrainCaseNumber].indexCase;

  editAlgs(INDEX_GROUP, INDEX_CASE);
}

/**
 * Displays and allows editing of algorithms for a selected case in a group.
 *
 * This function sets the image and algorithm list for the current case,
 * making the appropriate elements visible or invisible based on the number
 * of algorithms available. It also highlights the selected algorithm,
 * differentiating between default and custom algorithms, and sets the
 * custom algorithm text input to the saved value. Finally, it opens the
 * algorithm editing dialog and focuses on the image.
 *
 * @param {number} indexGroup - The index of the group containing the case.
 * @param {number} indexCase - The index of the case within the group.
 */
function editAlgs(indexGroup, indexCase) {
  selectedCase = indexCase;
  const GROUP = GROUPS[indexGroup];
  selectedAlgNumber = GROUP.algorithmSelection[selectedCase];

  // Set image
  ELEM_EDITALG_IMG.src = GROUP.imgPath + "right/F2L" + (selectedCase + 1) + ".svg";

  // Iterate through all algorithms
  for (let alg = 0; alg < NUM_ALG; alg++) {
    if (alg < GROUP.algorithms[selectedCase + 1].length) {
      // Set Text to Alg
      ELEM_EDITALG_LISTENTRY[alg].innerHTML = GROUP.algorithms[selectedCase + 1][alg];
      // Make all used elements visible
      ELEM_EDITALG_LISTENTRY[alg].style.display = "block";
    } else {
      // Make all unused elements invisible
      ELEM_EDITALG_LISTENTRY[alg].style.display = "none";
    }
    // Reset all backgrounds
    ELEM_EDITALG_LISTENTRY[alg].style.background = COLORS_ALG[0];
  }
  // Check if previously saved alg is default of custom
  if (selectedAlgNumber < GROUP.algorithms[selectedCase + 1].length) {
    // If alg is default set color of selected alg
    ELEM_EDITALG_LISTENTRY[GROUP.algorithmSelection[selectedCase]].style.background = COLORS_ALG[1];
    // and reset color of custom
    ELEM_EDITALG_CUSTOMALG.style.background = COLORS_ALG[0];
  } else {
    // If alg is custom set color
    ELEM_EDITALG_CUSTOMALG.style.background = COLORS_ALG[1];
  }

  // Set text in Textbox to saved value
  ELEM_EDITALG_CUSTOMALG.value = GROUP.customAlgorithms[selectedCase];
  openDialog(ELEM_EDITALG_CONTAINER);
  ELEM_EDITALG_IMG.focus();
}

/**
 * Handles the custom algorithm text input box being clicked.
 * Resets the background of the previously selected algorithm and sets
 * the background of the custom algorithm text box to the selected color.
 * Sets the selected algorithm to the custom algorithm.
 * for the current case, indicating that the custom algorithm is selected.
 */
function customAlgSelected() {
  // Set Background of Textbox
  ELEM_EDITALG_LISTENTRY[selectedAlgNumber].style.background = COLORS_ALG[0];
  // Reset Background of previously selected Alg
  ELEM_EDITALG_CUSTOMALG.style.background = COLORS_ALG[1];
  // Set selected Alg to number of selected Alg
  selectedAlgNumber = GROUPS[ELEM_SELECT_GROUP.selectedIndex].algorithms[selectedCase + 1].length;
}

/**
 * Handles keydown events and executes corresponding actions based on the key pressed.
 *
 * Supported keys and their actions:
 * - 'C' (KeyCode: 67): Clears user data on double press.
 * - 'G' (KeyCode: 71): Logs the local storage.
 * - Space (KeyCode: 32): Triggers spaceDown() if not in case select mode.
 * - Right Arrow (KeyCode: 39): Calls showHint() if not in case select mode.
 * - Left Arrow (KeyCode: 37): Reserved for future actions.
 * - 'S' (KeyCode: 83): Reserved for saving user data.
 * - 'L' (KeyCode: 76): Reserved for loading user data.
 *
 * The function respects the current mode and does not perform certain actions
 * (like spaceDown or showHint) if the mode is case select (mode === 0).
 *
 * @param {Event} e - The event object containing information about the key pressed.
 */
function keydown(e) {
  /*
  rechts: 39
  links: 37
  Leertaste: 32
  */
  if (e.keyCode === 67) {
    // C
    if (flagdoublepress) {
      clearUserData();
      flagdoublepress = false;
    } else {
      flagdoublepress = true;
      window.setTimeout(function () {
        flagdoublepress = false;
      }, 500);
    }
  } else if (e.keyCode === 71) {
    // G
    // Log Local Storage
    console.log(localStorage);
  } else {
    // console.log("Key pressed: " + e.keyCode);
  }

  if (mode === 0) return; // Do nothing when in case select mode

  if (e.keyCode === 32) {
    // Space key
    spaceDown();
  } else if (e.keyCode === 39) {
    // rechte Pfeiltaste
    showHint();
  } else if (e.keyCode === 37) {
    // linke Pfeiltaste
  } else if (e.keyCode === 83) {
    // S
    // saveUserData();
  } else if (e.keyCode === 76) {
    // L
    // loadUserData();
  }
}

function keyup(e) {
  if (e.keyCode === 32) {
    // Space key
    spaceUp();
  }
}

/**
 * Updates the list of cases to be trained based on the current settings.
 * Called when settings are changed.
 *
 * Updates the following variables:
 * - trainStateSelection
 * - trainGroupSelection
 * - leftSelection
 * - rightSelection
 * - aufSelection
 * - hintImageSelection
 * - hintAlgSelection
 * - timerEnabled
 * - currentTrainCaseNumber
 * - generatedScrambles
 *
 * Then it generates a new list of cases to be trained and updates the hint visibility.
 * Finally, it displays the next scramble.
 */
function updateTrainCases() {
  trainStateSelection = [
    ELEM_CHECKBOX_UNLEARNED.checked,
    ELEM_CHECKBOX_LEARNING.checked,
    ELEM_CHECKBOX_FINISHED.checked,
  ];
  trainGroupSelection = [
    ELEM_CHECKBOX_BASIC.checked,
    ELEM_CHECKBOX_BASIC_BACK.checked,
    ELEM_CHECKBOX_ADVANCED.checked,
    ELEM_CHECKBOX_EXPERT.checked,
  ];
  leftSelection = ELEM_CHECKBOX_LEFT.checked;
  rightSelection = ELEM_CHECKBOX_RIGHT.checked;
  aufSelection = ELEM_CHECKBOX_AUF.checked;
  hintImageSelection = ELEM_SELECT_HINT_IMAGE.selectedIndex;
  hintAlgSelection = ELEM_SELECT_HINT_ALG.selectedIndex;
  timerEnabled = ELEM_CHECKBOX_TIMER_ENABLE.checked;

  if (timerEnabled) {
    ELEM_TIMER.style.display = "block";
  } else {
    ELEM_TIMER.style.display = "none";
  }

  currentTrainCaseNumber = -1;
  generatedScrambles = [];
  closeOverlays();
  updateHintVisibility();
  generateTrainCaseList();
  // saveUserData();
  nextScramble(1);
}

/**
 * Called when the Show Hint button is pressed.
 * Shows the hint for the current scramble.
 * If the hint setting is set to "Reveal step-by-step", it shows one move at a time.
 * If the hint setting is set to "Reveal all at once", it shows the full algorithm.
 * If the hint setting is set to "Show all time", it does nothing.
 * @returns {void}
 */
function showHint() {
  if (generatedScrambles.length == 0 || hintAlgSelection == 2) return;

  document.querySelector("twisty-alg-viewer").style.display = "flex";
  ELEM_HINT_PLACEHOLDER.style.display = "none";

  if (hintAlgSelection == 0) {
    if (hintCounter == 0)
      document.querySelectorAll(".twisty-alg-move").forEach((element) => (element.style.visibility = "hidden"));

    document.querySelector("twisty-alg-viewer").style.display = "flex";
    ELEM_HINT_PLACEHOLDER.style.display = "none";

    ELEM_HINT_IMG.style.opacity = "1";

    // Get algorithm and convert to list
    const ALG_LIST = generatedScrambles[currentTrainCaseNumber].algHint.split(" ");
    // Show one move at a time
    if (hintCounter < ALG_LIST.length) {
      document.querySelectorAll(".twisty-alg-move")[hintCounter].style.visibility = "visible";
    }

    hintCounter++;
  }
}

/**
 * Shows only the selected group in select mode (Executed when dropdown box is changed)
 * Scrolls to the top of the page and saves the selection to local storage.
 */
function showSelectedGroup() {
  for (let indexGroup = 0; indexGroup < GROUPS.length; indexGroup++) {
    if (ELEM_SELECT_GROUP.selectedIndex === indexGroup) {
      ELEM_GROUP_CONTAINER[indexGroup].style.display = "flex";
    } else {
      ELEM_GROUP_CONTAINER[indexGroup].style.display = "none";
    }
  }
  // Scroll to the top
  window.scrollTo(0, 0);
  viewSelection = ELEM_SELECT_GROUP.selectedIndex;
  saveUserData();
}

/**
 * Generates a new list of cases to be trained and adds them to the current list.
 * Called when settings are changed or when the list of cases to be trained is empty.
 * Adds all cases that shall be learned to trainCaseList, chooses a random scramble for each case,
 * gets the hint algorithm for each case, mirrors the algorithm and scramble if right selection is true,
 * adds a random U move to the scramble if auf selection is true, and adds the case to the list.
 * Randomizes the order of the cases in the list, and adds the new cases to the current list.
 * If no cases are selected, the text "no case selected" is displayed on the page.
 */
function generateTrainCaseList() {
  trainCaseList = [];
  // Add all cases that shall be learned to trainCaseList
  for (let indexGroup = 0; indexGroup < GROUPS.length; indexGroup++) {
    const GROUP = GROUPS[indexGroup];
    // Skip if group is not selected in settings
    if (!trainGroupSelection[indexGroup]) continue;
    for (let indexCategory = 0; indexCategory < GROUP.categoryCases.length; indexCategory++) {
      let categoryItems = GROUP.categoryCases[indexCategory];
      for (let indexCategoryItem = 0; indexCategoryItem < categoryItems.length; indexCategoryItem++) {
        let indexCase = categoryItems[indexCategoryItem] - 1;
        for (let state = 0; state < trainStateSelection.length; state++) {
          // Check if case is in selected state
          if (trainStateSelection[state] && GROUP.caseSelection[indexCase] == state) {
            if (GROUP.scrambles[indexCase + 1] == undefined)
              console.warn(
                "GROUP.scrambles[indexCase + 1] == undefined\nindexGroup: " +
                  indexGroup +
                  "\nindexCase: " +
                  indexCase +
                  "\ngroup.scrambles: " +
                  GROUP.scrambles
              );

            // Choose random scramble for current case
            const iNDEX_SCRAMBLE = parseInt(Math.random() * GROUP.scrambles[indexCase + 1].length);
            let selectedScramble = GROUP.scrambles[indexCase + 1][iNDEX_SCRAMBLE];

            // Get hint algorithm for current case
            if (GROUP.algorithmSelection[indexCase] >= GROUP.algorithms[indexCase + 1].length) {
              algHint = GROUP.customAlgorithms[indexCase];
            } else {
              algHint = GROUP.algorithms[indexCase + 1][GROUP.algorithmSelection[indexCase]];
            }

            // Mirror algorithm
            let mirroring;
            if (rightSelection && leftSelection) {
              mirroring = parseInt(Math.floor(Math.random() * 2));
            } else if (rightSelection && !leftSelection) {
              mirroring = 0;
            } else if (!rightSelection && leftSelection) {
              mirroring = 1;
            }
            if (mirroring) {
              selectedScramble = mirrorAlg(selectedScramble);
              algHint = mirrorAlg(algHint);
            }

            // Add random U move to selected scramble
            let selectedScrambleAUF;
            if (aufSelection) {
              selectedScrambleAUF = addRandomUMove(selectedScramble);
            } else selectedScrambleAUF = selectedScramble;

            const CASE_TO_ADD = {
              indexGroup: indexGroup,
              indexCase: indexCase,
              indexScramble: iNDEX_SCRAMBLE,
              mirroring: mirroring,
              selectedScramble: selectedScramble,
              selectedScrambleAUF: selectedScrambleAUF,
              algHint: algHint,
            };

            trainCaseList.push(CASE_TO_ADD);
            break;
          }
        }
      }
    }
  }

  // Exit if no cases are selected
  if (trainCaseList.length == 0) ELEM_SCRAMBLE.innerHTML = "no case selected";

  // Randomize Cases
  for (let i = trainCaseList.length - 1; i > 0; i--) {
    const J = Math.floor(Math.random() * (i + 1));
    const TEMP = trainCaseList[i];
    trainCaseList[i] = trainCaseList[J];
    trainCaseList[J] = TEMP;
  }
  // Add new cases to current list
  generatedScrambles = generatedScrambles.concat(trainCaseList);
}

/**
 * Show next/previous case
 * Called when user clicks on Previous/Next Scramble button or presses space
 * @param {number} nextPrevious - 0 to show previous case, 1 to show next case
 */
function nextScramble(nextPrevious) {
  // Show next/previous case
  // (nextPrevious = 0: previous case, nextPrevious = 1: next case)
  if (hintImageSelection == 1) {
    ELEM_HINT_IMG.style.opacity = "0.3";
    ELEM_LOADING_CASE.classList.remove(CLASS_DISPLAY_NONE);
  }

  if (generatedScrambles.length == 0) return;

  if (nextPrevious) {
    if (currentTrainCaseNumber >= 0)
      // Increase Solve Counter
      GROUPS[generatedScrambles[currentTrainCaseNumber].indexGroup].solveCounter[
        generatedScrambles[currentTrainCaseNumber].indexCase
      ]++;
    currentTrainCaseNumber++;
    if (currentTrainCaseNumber >= generatedScrambles.length) {
      generateTrainCaseList();
      if (generatedScrambles.length <= 0) {
        return;
      }
    }
  } else if (currentTrainCaseNumber > 0) {
    currentTrainCaseNumber--;
  }

  if (generatedScrambles[currentTrainCaseNumber] == undefined) return;

  // Update scramble text
  ELEM_SCRAMBLE.innerHTML = generatedScrambles[currentTrainCaseNumber].selectedScrambleAUF;

  // Reset hint counter
  hintCounter = 0;
  // Reset or show full hint based on setting
  document.querySelectorAll(".twisty-alg-move").forEach((element) => (element.style.visibility = "visible"));
  if (hintAlgSelection == 0 || hintAlgSelection == 1) {
    // Reveal step-by-step or Reveal all at once
    document.querySelector("twisty-alg-viewer").style.display = "none";
    ELEM_HINT_PLACEHOLDER.style.display = "flex";
    // ELEM_HINT_CONTAINER.style.cursor = "pointer";
  } else if (hintAlgSelection == 2) {
    document.querySelector("twisty-alg-viewer").style.display = "flex";
    ELEM_HINT_PLACEHOLDER.style.display = "none";
  }

  // Update hint image
  const INDEX_GROUP = generatedScrambles[currentTrainCaseNumber].indexGroup;
  const INDEX_CASE = generatedScrambles[currentTrainCaseNumber].indexCase;
  const MIRRORING = generatedScrambles[currentTrainCaseNumber].mirroring;
  const GROUP = GROUPS[INDEX_GROUP];

  if (!MIRRORING) {
    ELEM_HINT_IMG.src = GROUP.imgPath + "right/F2L" + (INDEX_CASE + 1) + ".svg";
  } else {
    ELEM_HINT_IMG.src = GROUP.imgPath + "left/F2L" + (INDEX_CASE + 1) + ".svg";
  }

  ELEM_TWISTY_PLAYER.experimentalSetupAlg = "z2 y' " + generatedScrambles[currentTrainCaseNumber].selectedScramble;
  ELEM_TWISTY_PLAYER.alg = generatedScrambles[currentTrainCaseNumber].algHint;
  resetTwistyPlayerView();
  ELEM_TWISTY_PLAYER.jumpToStart();
  ELEM_TWISTY_PLAYER.flash();
  ELEM_TWISTY_PLAYER.blur();

  hidePieces(GROUP.piecesToHide, INDEX_CASE, MIRRORING);

  ELEM_DEBUG_INFO.innerHTML =
    GROUPS[INDEX_GROUP].name +
    ", Case " +
    (INDEX_CASE + 1) +
    ", Scramble " +
    +generatedScrambles[currentTrainCaseNumber].indexScramble +
    ", " +
    CATEGORY_NAMES[GROUPS[INDEX_GROUP].caseSelection[INDEX_CASE]] +
    ", Algorithm " +
    GROUPS[INDEX_GROUP].algorithmSelection[INDEX_CASE] +
    ", " +
    STRING_MIRRORED[MIRRORING] +
    " Slot, Solve Counter: " +
    GROUP.solveCounter[INDEX_CASE];

  currentTrainGroup = INDEX_GROUP;
  currentTrainCase = INDEX_CASE;

  saveUserData();
}

/**
 * Sets the checkboxes to display the current settings.
 * Executed when the settings dialog is opened.
 */
function updateCheckboxStatus() {
  ELEM_CHECKBOX_UNLEARNED.checked = trainStateSelection[0];
  ELEM_CHECKBOX_LEARNING.checked = trainStateSelection[1];
  ELEM_CHECKBOX_FINISHED.checked = trainStateSelection[2];
  ELEM_CHECKBOX_BASIC.checked = trainGroupSelection[0];
  ELEM_CHECKBOX_BASIC_BACK.checked = trainGroupSelection[1];
  ELEM_CHECKBOX_ADVANCED.checked = trainGroupSelection[2];
  ELEM_CHECKBOX_EXPERT.checked = trainGroupSelection[3];
  ELEM_CHECKBOX_LEFT.checked = leftSelection;
  ELEM_CHECKBOX_RIGHT.checked = rightSelection;
  ELEM_CHECKBOX_AUF.checked = aufSelection;
  ELEM_SELECT_HINT_IMAGE.selectedIndex = hintImageSelection;
  ELEM_SELECT_HINT_ALG.selectedIndex = hintAlgSelection;
  ELEM_CHECKBOX_TIMER_ENABLE.checked = timerEnabled;
}

/**
 * Updates the visibility of the hint image and the Twisty Player based on the value of the "Hint image" select element.
 * Called when settings are changed.
 */
function updateHintVisibility() {
  switch (ELEM_SELECT_HINT_IMAGE.selectedIndex) {
    case 0:
      // No hint
      ELEM_DIV_HINT_IMG.classList.remove("display-none");
      ELEM_HINT_IMG.style.visibility = "hidden";
      ELEM_DIV_TWISTY_PLAYER.classList.add("display-none");
      break;
    case 1:
      // 2D image as hint
      ELEM_DIV_HINT_IMG.classList.remove("display-none");
      ELEM_HINT_IMG.style.visibility = "visible";
      ELEM_DIV_TWISTY_PLAYER.classList.add("display-none");
      break;
    case 2:
      // 3D cube as hint
      ELEM_DIV_HINT_IMG.classList.add("display-none");
      ELEM_DIV_TWISTY_PLAYER.classList.remove("display-none");
      break;
    default:
      // 3D cube as hint
      ELEM_DIV_HINT_IMG.classList.add("display-none");
      ELEM_DIV_TWISTY_PLAYER.classList.remove("display-none");
  }
}

/**
 * Toggles the visibility of the debug information section in train mode.
 * Updates the button text to indicate the current state as "Show info" or "Hide info".
 */
function showHideDebugInfo() {
  // Show/hide debug info on the bottom of train mode
  if (boolShowDebugInfo) {
    boolShowDebugInfo = false;
    ELEM_BTN_SHOW_HIDE_DEBUG_INFO.innerHTML = "> Show info";
    ELEM_DEBUG_INFO.style.display = "none";
  } else {
    boolShowDebugInfo = true;
    ELEM_BTN_SHOW_HIDE_DEBUG_INFO.innerHTML = "> Hide info";
    ELEM_DEBUG_INFO.style.display = "block";
  }
}

/**
 * Executed when image is clicked in select mode.
 * Changes the learning state of a case and updates the corresponding visual elements.
 * Called when image in pressen in select mode or learning state in changed in tranin mode.
 * @param {number} indexGroup - Index of the group.
 * @param {number} indexCategory - Index of the category within the group.
 * @param {number} indexCase - Index of the case.
 */
function changeState(indexGroup, indexCategory, indexCase) {
  const GROUP = GROUPS[indexGroup];
  GROUP.caseSelection[indexCase]++;
  if (GROUP.caseSelection[indexCase] >= 3) {
    GROUP.caseSelection[indexCase] = 0;
  }
  GROUP.divContainer[indexCase].style.background = CATEGORY_COLORS[GROUP.caseSelection[indexCase]];
  GROUP.divContainer[indexCase].style.color = CATEGORY_TEXT_COLOR[GROUP.caseSelection[indexCase]];
  GROUP.divContainer[indexCase].style.borderStyle = CATEGORY_BORDERS[GROUP.caseSelection[indexCase]];
  GROUP.imgEdit[indexCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]];
  GROUP.imgMirror[indexCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]];
  highlightBulkChangeTrainingStateButton(indexGroup, indexCategory, indexCase);
  saveUserData();

  // Hide Press me text that is shown when site is visited first time
  if ((indexGroup == 0) & (indexCase == 3) & (divPressMe != undefined)) divPressMe.classList.add("display-none");
}

/**
 * Toggles the expansion and collapse of a category in select mode.
 * Updates the visual state of the category container and arrow icon,
 * and saves the updated user data.
 *
 * @param {number} indexGroup - Index of the group.
 * @param {number} indexCategory - Index of the category within the group.
 */
function collapseCategory(indexGroup, indexCategory) {
  const GROUP = GROUPS[indexGroup];
  const CATEGORY_CONATINER = GROUP.categoryContainer[indexCategory];
  if (GROUP.collapse[indexCategory] == true) {
    // expand
    GROUP.categoryCollapseImg[indexCategory].classList.add("rotate-arrow");
    expand(CATEGORY_CONATINER, 300);
    GROUP.collapse[indexCategory] = false;
  } else {
    // colapse
    GROUP.categoryCollapseImg[indexCategory].classList.remove("rotate-arrow");
    collapse(CATEGORY_CONATINER, 300);
    GROUP.collapse[indexCategory] = true;
  }
  saveUserData();
}

/**
 * Collapse/Minimize the specific category in select mode.
 * Updates the visual state of the category container
 * by setting height, padding, margin, and overflow properties.
 *
 * @param {HTMLElement} target - The element to collapse.
 * @param {number} [duration=300] - The duration of the collapse animation in milliseconds.
 */
function collapse(target, duration = 300) {
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.boxSizing = "border-box";
  target.style.height = target.offsetHeight + "px";
  target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  window.setTimeout(() => {
    target.classList.add("display-none");
    target.style.removeProperty("height");
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
}

/**
 * Expand the specific category in select mode.
 * Updates the visual state of the category container
 * by setting height, padding, margin, and overflow properties.
 *
 * @param {HTMLElement} target - The element to expand.
 * @param {number} [duration=300] - The duration of the expand animation in milliseconds.
 */
let expand = (target, duration = 300) => {
  // Expand the specific category in select mode
  target.classList.remove("display-none");
  let height = target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  target.offsetHeight;
  target.style.boxSizing = "border-box";
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.height = height + "px";
  target.style.removeProperty("padding-top");
  target.style.removeProperty("padding-bottom");
  target.style.removeProperty("margin-top");
  target.style.removeProperty("margin-bottom");
  window.setTimeout(() => {
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
};

/**
 * Toggle between select mode and train mode.
 * mode: 0 = select, 1 = train
 */
function changeMode() {
  if (mode == 0) {
    mode = 1;
    updateTrainCases();
    ELEM_BTN_CHANGE_MODE.innerHTML = "Select cases";
    ELEM_WINDOW_SELECT.classList.add("display-none");
    ELEM_WINDOW_TRAIN.classList.remove("display-none");
    //ELEM_BUTTON_SETTING_SELECT.classList.add("display-none");
    //ELEM_BUTTON_SETTINGS.classList.remove("display-none");
    // ELEM_CONTAINER_SELECT_GROUP.classList.add("display-none");
    ELEM_SELECT_GROUP.classList.add("display-none");
    if (firstVisitTrain) {
      firstVisitTrain = false;
      //showWelcomeTrainPopup();
    }
  } else {
    mode = 0;
    ELEM_BTN_CHANGE_MODE.innerHTML = "Train";
    ELEM_WINDOW_SELECT.classList.remove("display-none");
    ELEM_WINDOW_TRAIN.classList.add("display-none");
    //ELEM_BUTTON_SETTING_SELECT.classList.remove("display-none");
    //ELEM_BUTTON_SETTINGS.classList.add("display-none");
    // ELEM_CONTAINER_SELECT_GROUP.classList.remove("display-none");
    ELEM_SELECT_GROUP.classList.remove("display-none");
  }
  ELEM_BTN_CHANGE_MODE.blur(); // Make button lose focus
}

/**
 * Checks for duplicate cases within each group in the GROUPS array.
 * Iterates through all cases in each group's categoryCases and logs a warning
 * in the console if any duplicate cases are found.
 */
function checkForDuplicates() {
  // Check if there are any duplicate cases in GROUPS
  for (let indexGroup = 0; indexGroup < GROUPS.length; indexGroup++) {
    const GROUP = GROUPS[indexGroup];
    const FLATTENED_LIST = GROUP.categoryCases.flat();
    for (let i = 0; i < FLATTENED_LIST.length; i++) {
      const CASE_I = FLATTENED_LIST[i];
      for (let j = 0; j < FLATTENED_LIST.length; j++) {
        if (i == j) continue;
        const CASE_J = FLATTENED_LIST[j];
        if (CASE_I == CASE_J) console.warn("Duplicate Case in Group " + GROUP.name + ", Case " + CASE_I);
      }
    }
  }
}

/**
 * Change the learning state of the current case
 * (Executed when learning state is changed in train mode)
 */
function changeStateRadio() {
  const GROUP = GROUPS[currentTrainGroup];
  if (GROUP == undefined) return;
  // console.log(GROUP.caseSelection[currentTrainCase]);
  if (ELEM_RADIO_UNLEARNED.checked == true) GROUP.caseSelection[currentTrainCase] = 0;
  if (ELEM_RADIO_LEARNING.checked == true) GROUP.caseSelection[currentTrainCase] = 1;
  if (ELEM_RADIO_FINISHED.checked == true) GROUP.caseSelection[currentTrainCase] = 2;
  // console.log(GROUP.caseSelection[currentTrainCase]);
  GROUP.divContainer[currentTrainCase].style.background = CATEGORY_COLORS[GROUP.caseSelection[currentTrainCase]];
  GROUP.divContainer[currentTrainCase].style.color = CATEGORY_TEXT_COLOR[GROUP.caseSelection[currentTrainCase]];
  GROUP.divContainer[currentTrainCase].style.borderStyle = CATEGORY_BORDERS[GROUP.caseSelection[currentTrainCase]];
  GROUP.imgEdit[currentTrainCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[currentTrainCase]];
  GROUP.imgMirror[currentTrainCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[currentTrainCase]];

  saveUserData();
  highlightAllBulkChangeTrainingStateButtons();
  closeOverlays();
}

/**
 * Toggle the timer on and off
 * If the timer is currently running, this function will stop the timer.
 * If the timer is currently stopped, this function will start the timer from 0.
 */
function toggleTimer() {
  if (flagTimerRunning) {
    flagTimerRunning = false;
  } else {
    count = 0;
    second = 0;
    flagTimerRunning = true;
    timer();
  }
}

/**
 * Updates the timer display every 10 milliseconds while the timer is running.
 * Increments the count variable until it reaches 100, then increments the second variable.
 * Formats the timer display with leading zeros and updates the HTML element.
 */
function timer() {
  if (flagTimerRunning) {
    count++;
    if (count == 100) {
      second++;
      count = 0;
    }

    let secString = second;
    let countString = count;

    if (second < 10) {
      secString = "0" + secString;
    }
    if (count < 10) {
      countString = "0" + countString;
    }

    ELEM_TIMER.innerHTML = secString + ":" + countString;
    setTimeout(timer, 10);
  }
}

/**
 * Converts a timer time (in 10ms units) into a string of the form "ss:cc",
 * where ss is the number of seconds and cc is the number of centiseconds.
 * @param {number} time - The timer time in 10ms units.
 * @returns {string} A string of the form "ss:cc" representing the time.
 */
let timeToString = function (time) {
  let countString = time % 100;
  let secString = Math.floor(time / 100);
  if (secString < 10) {
    secString = "0" + secString;
  }
  if (countString < 10) {
    countString = "0" + countString;
  }
  return secString + ":" + countString;
};

/**
 * Handles the spacebar key press event.
 *
 * If the timer is enabled, toggle the timer and go to the next case if the timer was running.
 * If the timer is not enabled, go to the next case.
 *
 * @see toggleTimer
 * @see nextScramble
 */
function spaceDown() {
  if (
    ELEM_WELCOME_CONATINER.open ||
    ELEM_WELCOME_CONATINER_TRAIN.open ||
    ELEM_INFO_CONTAINER.open ||
    ELEM_EDITALG_CONTAINER.open ||
    ELEM_CONTAINER_TRAIN_SETTINGS.open ||
    //ELEM_CONTAINER_SELECT_SETTINGS.open ||
    ELEM_CHANGE_STATE_POPUP.open
  )
    return;

  if (timerEnabled) {
    if (flagTimerRunning) {
      nextScramble(1);
      toggleTimer();
      spacePressFlag = true;
    } else {
      ELEM_TIMER.style.color = "#00ee00"; // yellow
    }
  } else {
    flagTimerRunning = false;
    nextScramble(1);
  }

  // Hide Press me text
  ELEM_PRESS_ME_TRAIN.classList.add("display-none");
}

/**
 * Handles the spacebar key release event.
 *
 * If the timer is enabled, toggle the timer if the timer was running and the spacebar was not pressed before.
 * If the timer is not enabled, do nothing.
 *
 * @see toggleTimer
 */
function spaceUp() {
  if (timerEnabled) {
    if (spacePressFlag == false) {
      ELEM_TIMER.style.color = COLOR_TEXT;
      toggleTimer();
    }
    spacePressFlag = false;
  }
}

/**
 * Changes the learning state of all cases within a specified category.
 * Adjusts the visual elements associated with each case to reflect the new state.
 * Resizes the button corresponding to the selected state to indicate active selection.
 *
 * @param {number} indexGroup - The index of the group containing the category.
 * @param {number} indexCategory - The index of the category within the group.
 * @param {number} state - The new learning state to set for all cases in the category.
 */
function changeLearningStateBulk(indexGroup, indexCategory, state) {
  // console.log("indexGroup: " + indexGroup + ", indexCategory: " + indexCategory + ", state: " + state);
  const GROUP = GROUPS[indexGroup];
  let categoryItems = GROUP.categoryCases[indexCategory];

  GROUP.btnChangeLearningState[0][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_SMALL;
  GROUP.btnChangeLearningState[1][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_SMALL;
  GROUP.btnChangeLearningState[2][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_SMALL;
  GROUP.btnChangeLearningState[state][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_BIG;

  for (let indexCategoryItem = 0; indexCategoryItem < categoryItems.length; indexCategoryItem++) {
    let indexCase = categoryItems[indexCategoryItem] - 1;

    GROUP.caseSelection[indexCase] = state;

    GROUP.divContainer[indexCase].style.background = CATEGORY_COLORS[GROUP.caseSelection[indexCase]];
    GROUP.divContainer[indexCase].style.color = CATEGORY_TEXT_COLOR[GROUP.caseSelection[indexCase]];
    GROUP.divContainer[indexCase].style.borderStyle = CATEGORY_BORDERS[GROUP.caseSelection[indexCase]];
    GROUP.imgEdit[indexCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]];
    GROUP.imgMirror[indexCase].style.filter = COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]];
    // console.log(COLORS_BTN_EDIT[GROUP.caseSelection[indexCase]]);
  }
  saveUserData();
}

/**
 * Makes the button bigger if all cases in category are in the same learning state.
 * @param {number} indexGroup - The index of the group containing the category.
 * @param {number} indexCategory - The index of the category within the group.
 */
function highlightBulkChangeTrainingStateButton(indexGroup, indexCategory) {
  // Make the button bigger if all cases in category are in the same learning state
  const GROUP = GROUPS[indexGroup];
  let categoryItems = GROUP.categoryCases[indexCategory];
  let numUnlearned = 0,
    numLearning = 0,
    numFinished = 0;
  for (let indexCategoryItem = 0; indexCategoryItem < categoryItems.length; indexCategoryItem++) {
    let indexCase = categoryItems[indexCategoryItem] - 1;
    if (GROUP.caseSelection[indexCase] == 0) numUnlearned++;
    if (GROUP.caseSelection[indexCase] == 1) numLearning++;
    if (GROUP.caseSelection[indexCase] == 2) numFinished++;
  }

  GROUP.btnChangeLearningState[0][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_SMALL;
  GROUP.btnChangeLearningState[1][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_SMALL;
  GROUP.btnChangeLearningState[2][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_SMALL;

  if (numLearning + numFinished == 0)
    GROUP.btnChangeLearningState[0][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_BIG;
  if (numFinished + numUnlearned == 0)
    GROUP.btnChangeLearningState[1][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_BIG;
  if (numUnlearned + numLearning == 0)
    GROUP.btnChangeLearningState[2][indexCategory].style.height = SIZE_BTN_CHANGE_LEARNING_STATE_BIG;

  // console.log("numUnlearned: " + numUnlearned + ", numLearning: " + numLearning + ", numFinished: " + numFinished);
}

/**
 * Iterates over all groups and categories to highlight the bulk change training state buttons.
 * Calls the `highlightBulkChangeTrainingStateButton` function for each category in each group,
 * adjusting button size based on the learning state of all cases within the category.
 */
function highlightAllBulkChangeTrainingStateButtons() {
  for (let indexGroup = 0; indexGroup < GROUPS.length; indexGroup++) {
    const GROUP = GROUPS[indexGroup];
    for (let indexCategory = 0; indexCategory < GROUP.categoryCases.length; indexCategory++) {
      highlightBulkChangeTrainingStateButton(indexGroup, indexCategory);
    }
  }
}

/**
 * Mirror single case
 * Called when Mirror button is pressed in select mode
 * @param {number} indexGroup - The index of the group containing the case.
 * @param {number} indexCase - The index of the case within the group.
 */
function mirrorCase(indexGroup, indexCase) {
  const GROUP = GROUPS[indexGroup];
  let tempAlg = "";

  if (GROUP.algorithmSelection[indexCase] < GROUP.algorithms[indexCase + 1].length) {
    tempAlg = GROUP.algorithms[indexCase + 1][GROUP.algorithmSelection[indexCase]];
  } else {
    tempAlg = GROUP.customAlgorithms[indexCase];
  }

  if (GROUP.flagMirrored[indexCase] == true) {
    GROUP.imgCase[indexCase].src = GROUP.imgPath + "right/F2L" + (indexCase + 1) + ".svg";
    GROUP.flagMirrored[indexCase] = false;
    GROUP.divAlgorithm[indexCase].innerHTML = tempAlg;
  } else {
    GROUP.imgCase[indexCase].src = GROUP.imgPath + "left/F2L" + (indexCase + 1) + ".svg";
    GROUP.flagMirrored[indexCase] = true;
    GROUP.divAlgorithm[indexCase].innerHTML = mirrorAlg(tempAlg);
  }
}

/**
 * Displays a "Press me" text when the site is visited for the first time.
 * Creates a new div element with the class "div-press-me" and appends it to the
 * specified image container of the first group. The text is shown only if it's the
 * user's first visit, as indicated by the `firstVisit` flag.
 */
function showPressMeText() {
  if (firstVisit) {
    divPressMe = document.createElement("div");
    divPressMe.classList.add("div-press-me");
    divPressMe.innerHTML = "Press<br>me";
    GROUPS[0].imgContainer[3].appendChild(divPressMe);
  }
}

function hidePressMeTrainText() {
  if (!firstVisitTrain) {
    ELEM_PRESS_ME_TRAIN.classList.add("display-none");
  }
}

function copyUTLtoClipboard() {
  alert("URL copied to clipboard");
  navigator.clipboard.writeText(ELEM_INPUT_EXPORT.value);
}

function showResetButton() {
  // Show reset button in twisty player (3D cube in train mode)
  ELEM_BTN_RESET_PLAYER_VIEW.classList.remove("display-none");
}

/**
 * Resets the TwistyPlayer's (3D cube in train mode) camera view to the
 * default position.
 */
function resetTwistyPlayerView() {
  // Reset twisty player (3D cube in train mode)
  const MIRRORING = generatedScrambles[currentTrainCaseNumber].mirroring;

  if (!MIRRORING) {
    ELEM_TWISTY_PLAYER.cameraLongitude = 25;
  } else {
    ELEM_TWISTY_PLAYER.cameraLongitude = -25;
  }
  ELEM_TWISTY_PLAYER.cameraLatitude = 25;

  ELEM_BTN_RESET_PLAYER_VIEW.classList.add("display-none");
}

/**
 * This function sets the pieces in Twisty player (3D cube in train mode) to be shown/hidden
 * In some cases three slots are solves. In some cases only two slots are solved. For the user to know which case is to be solved, the pieces of the other F2L slot need to be hidden.
 * @param {number[]} piecesToHideArray An array of numbers indicating which pieces to hide for each case.
 * @param {number} indexCase The index of the case to be shown.
 * @param {boolean} mirroring If true, the pieces are mirrored.
 */
function hidePieces(piecesToHideArray, indexCase, mirroring) {
  if (piecesToHideArray !== undefined) {
    const piecesToHide = piecesToHideArray[indexCase];

    if (!mirroring) {
      switch (piecesToHide) {
        case 1:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIIII---,CORNERS:I---IIII,CENTERS:------"; // hide red-green
          break;
        case 2:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII--I-,CORNERS:-I--IIII,CENTERS:------"; // hide red-blue
          break;
        case 3:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII---I,CORNERS:--I-IIII,CENTERS:------"; // hide blue-orange
          break;
        case 4:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII-I--,CORNERS:---IIIII,CENTERS:------"; // hide green-orange
          break;
        default:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII----,CORNERS:----IIII,CENTERS:------"; // show all F2L
      }
    } else {
      switch (piecesToHide) {
        case 1:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII--I-,CORNERS:-I--IIII,CENTERS:------"; // hide red-blue
          break;
        case 2:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIIII---,CORNERS:I---IIII,CENTERS:------"; // hide red-green
          break;
        case 3:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII-I--,CORNERS:---IIIII,CENTERS:------"; // hide green-orange
          break;
        case 4:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII---I,CORNERS:--I-IIII,CENTERS:------"; // hide blue-orange
          break;
        default:
          ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII----,CORNERS:----IIII,CENTERS:------"; // show all F2L
      }
    }
  } else {
    ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII----,CORNERS:----IIII,CENTERS:------"; // show all F2L
  }

  // Stickering code fom issue: https://github.com/cubing/cubing.js/issues/324#issuecomment-2002467085
  // ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIIII---,CORNERS:I---IIII,CENTERS:------"; // red-green
  // ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII-I--,CORNERS:---IIIII,CENTERS:------"; // green-orange
  // ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII--I-,CORNERS:-I--IIII,CENTERS:------"; // red-blue
  // ELEM_TWISTY_PLAYER.experimentalStickeringMaskOrbits = "EDGES:----IIII---I,CORNERS:--I-IIII,CENTERS:------"; // blue-orange
}

function mousedown(e) {
  // onmousedown = "mousedown(event)";
  mousepositionLast = [e.clientX, e.clientY];
  // console.log("mousedown, position: " + mousepositionLast);
}

function mouseup(e) {
  // onmouseup = "mouseup(event)";
  const mouseposition = [e.clientX, e.clientY];

  if (mouseposition.toString() === mousepositionLast.toString()) {
    // console.log("same position");
    nextScramble(1);
  }

  // console.log("mouseup, position: " + mouseposition);
}

// ----------    POP-UPS    ----------

function closeOverlays() {
  ELEM_BODY.style.overflow = "auto";
  ELEM_WELCOME_CONATINER.close();
  ELEM_WELCOME_CONATINER_TRAIN.close();
  ELEM_INFO_CONTAINER.close();
  ELEM_EDITALG_CONTAINER.close();
  ELEM_CONTAINER_TRAIN_SETTINGS.close();
  // ELEM_CONTAINER_SELECT_SETTINGS.close();
  ELEM_CHANGE_STATE_POPUP.close();
  ELEM_FEEDBACK_CONTAINER.close();
}

function showWelcomePopup() {
  if (firstVisit) {
    openDialog(ELEM_WELCOME_CONATINER);
  }
}

function showWelcomeTrainPopup() {
  setFirstVisitTrain();
  openDialog(ELEM_WELCOME_CONATINER_TRAIN);
}

function showInfo() {
  openDialog(ELEM_INFO_CONTAINER);
  // ELEM_INFO_CONTAINER.scrollTo(0, 0);
}

// This is an attemt to load the YouTube video only if it needs to be shown. Similar to lazy load which would crash Chrome on Android
// function insertUrltoIframe() {
//   ELEM_THUMBNAIL_BUTTON.style.display = "none";
//   ELEM_IFRAME_VIDEO.style.display = "block";
//   // The following replaces lazy load, which would crash Chrome on Android
//   ELEM_IFRAME_VIDEO.src = "https://www.youtube.com/embed/EQbZvKssp7s?si=dfSdb3qlFpxnC89c&amp;start=20";
// }

//function showSettingsSelect() {
//  exportUserData();
//  openDialog(ELEM_CONTAINER_SELECT_SETTINGS);
//}

function showSettingsTrain() {
  exportLocalStorage();
  updateCheckboxStatus();
  openDialog(ELEM_CONTAINER_TRAIN_SETTINGS);
}

function showSetStateMenu() {
  const STATE = GROUPS[currentTrainGroup].caseSelection[currentTrainCase];
  if (STATE == 0 || STATE == "0") {
    ELEM_RADIO_UNLEARNED.checked = true;
  } else if (STATE == 1 || STATE == "1") {
    ELEM_RADIO_LEARNING.checked = true;
  } else if (STATE == 2 || STATE == "2") {
    ELEM_RADIO_FINISHED.checked = true;
  }

  openDialog(ELEM_CHANGE_STATE_POPUP);
}

function showFeedback() {
  openDialog(ELEM_FEEDBACK_CONTAINER);
  ELEM_FEEDBACK_NAME.focus();
}

function openDialog(ELEM) {
  ELEM.showModal();
  ELEM_BODY.style.overflow = "hidden";
}
