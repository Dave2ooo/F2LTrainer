const BASIC_COLLECTION = {
  // renamed!!!!! from basicCollection
  saveName: "basic_",
  saveNameCasesURL: "bc",
  saveNameAlgURL: "ba",
  name: "Basic Cases",
  idName: "Basic",
  scrambles: basicScrambles,
  algorithms: basicAlgorithms,
  // User saved
  algorithmSelection: basicAlgorithmSelection,
  caseSelection: basicCaseSelection,
  customAlgorithms: basicCustomAlgorithms,
  trash: basicTrash,
  collapse: basicCollapse,
  solveCounter: basicSolveCounter,
  //
  imgPath: "./images/basic_cases/",
  numberCases: 42,

  categoryNames: [
    "Basic Inserts",
    "Pieces on Top / White facing Front / Edge oriented",
    "Pieces on Top / White facing Front / Edge unoriented",
    "Pieces on Top / White facing Side / Edge oriented",
    "Pieces on Top / white facing Side / Edge unoriented",
    "Pieces on Top / White facing Up / Edge oriented",
    "Pieces on Top / White facing Up / Edge unoriented",
    "Edge solved",
    "Edge flipped",
    "Corner on Bottom / Edge on Top / Edge oriented",
    "Corner on Bottom / Edge on Top / Edge unoriented",
  ],
  categoryCases: [
    [4, 3, 1, 2],
    [5, 7, 15],
    [9, 11, 13],
    [10, 12, 14],
    [6, 8, 16],
    [17, 19, 21, 23],
    [18, 20, 22, 24],
    [32, 33, 34, 39, 40],
    [31, 35, 36, 41, 42, 38],
    [27, 30, 25],
    [29, 28, 26],
  ],
  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  btnChangeLearningState: [[], [], []],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
  btnContainer: [],
  btnMirror: [],
  imgMirror: [],
  flagMirrored: [],
  btnEdit: [],
  imgEdit: [],
  btnDelete: [],
  imgTrash: [],
  trashElementContainer: [],
  caseNumberTrash: [],
  imgContainerTrash: [],
  imgCaseTrash: [],
  btnRecover: [],
};

const BASIC_BACK_COLLECTION = {
  // renamed!!!!! from basicBackCollection
  saveName: "basicBack_",
  saveNameCasesURL: "bbc",
  saveNameAlgURL: "bba",
  name: "Basic Cases Backslot",
  idName: "BasicBack",
  scrambles: basicScramblesBack,
  algorithms: basicAlgorithmsBack,
  // User saved
  algorithmSelection: basicBackAlgorithmSelection,
  caseSelection: basicBackCaseSelection,
  customAlgorithms: basicBackCustomAlgorithms,
  trash: basicTrash,
  collapse: basicBackCollapse,
  solveCounter: basicBackSolveCounter,
  //
  imgPath: "./images/basic_cases_back/",
  numberCases: 42,

  categoryNames: [
    "Basic Inserts",
    "Pieces on Top / White facing Back / Edge oriented",
    "Pieces on Top / White facing Back / Edge unoriented",
    "Pieces on Top / White facing Side / Edge oriented",
    "Pieces on Top / white facing Side / Edge unoriented",
    "Pieces on Top / White facing Up / Edge oriented",
    "Pieces on Top / White facing Up / Edge unoriented",
    "Edge solved",
    "Edge flipped",
    "Corner on Bottom / Edge on Top / Edge oriented",
    "Corner on Bottom / Edge on Top / Edge unoriented",
  ],
  categoryCases: [
    [4, 3, 1, 2],
    [6, 8, 16],
    [10, 12, 14],
    [9, 11, 13],
    [5, 7, 15],
    [18, 20, 22, 24],
    [17, 19, 21, 23],
    [32, 34, 33, 40, 39],
    [31, 36, 35, 42, 41, 38],
    [28, 29, 26],
    [30, 27, 25],
  ],
  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  btnChangeLearningState: [[], [], []],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
  btnContainer: [],
  btnMirror: [],
  imgMirror: [],
  flagMirrored: [],
  btnEdit: [],
  imgEdit: [],
  btnDelete: [],
  imgTrash: [],
  trashElementContainer: [],
  caseNumberTrash: [],
  imgContainerTrash: [],
  imgCaseTrash: [],
  btnRecover: [],
};

const ADVANCED_COLLECTION = {
  // renamed!!!!! from advancedCollection
  saveName: "advanced_",
  saveNameCasesURL: "ac",
  saveNameAlgURL: "aa",
  name: "Advanced Cases",
  idName: "Advanced",
  scrambles: advancedScrambles,
  algorithms: advancedAlgorithms,
  // User saved
  algorithmSelection: advancedAlgorithmSelection,
  caseSelection: advancedCaseSelection,
  customAlgorithms: advandedCustomAlgorithms,
  trash: advancedTrash,
  collapse: advancedCollapse,
  solveCounter: advancedSolveCounter,
  //
  imgPath: "./images/advanced_cases/",
  numberCases: 42,

  categoryNames: [
    "Slot in Front  / White facing Up",
    "Slot in Front / White facing Front",
    "Slot in Front / White facing Side",
    "Slot in Front / Corner in Adjacent Slot",
    "Slot in Back / Edge in Adjacent Front Slot", // new
    "Slot in Back / Corner in Adjacent Front Slot",
    "Edge in Opposite Slot",
    "Corner in Opposite Slot",
  ],
  categoryCases: [
    [1, 2, 3, 4],
    [9, 10, 13, 14],
    [7, 8, 11, 12],
    [19, 20, 21, 22, 23, 24],
    [37, 38, 39, 40, 41, 42], // new
    [25, 26, 27, 28, 29, 30],
    [5, 6, 17, 18, 15, 16],
    [31, 32, 33, 34, 35, 36],
  ],

  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  btnChangeLearningState: [[], [], []],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
  btnContainer: [],
  btnMirror: [],
  imgMirror: [],
  flagMirrored: [],
  btnEdit: [],
  imgEdit: [],
  btnDelete: [],
  imgTrash: [],
  trashElementContainer: [],
  caseNumberTrash: [],
  imgContainerTrash: [],
  imgCaseTrash: [],
  btnRecover: [],
  piecesToHide: [
    4, 4, 2, 2, 1, 1, 4, 4, 2, 2, 2, 2, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1,
  ],
  // 1: hide red-green
  // 2: hide red-blue
  // 3: hide blue-orange
  // 4: hide green-orange
  // default: show all F2L
};

const EXPERT_COLLECTION = {
  // renamed!!!!! from expertCollection
  saveName: "expert_",
  saveNameCasesURL: "ec",
  saveNameAlgURL: "ea",
  name: "Expert Cases",
  idName: "Expert",
  scrambles: expertScrambles,
  algorithms: expertAlgorithms,
  // User saved
  algorithmSelection: expertAlgorithmSelection,
  caseSelection: expertCaseSelection,
  customAlgorithms: expertCustomAlgorithms,
  trash: expertTrash,
  collapse: expertCollapse,
  solveCounter: expertSolveCounter,
  //
  imgPath: "./images/expert_cases/",
  numberCases: 17,

  categoryNames: [
    "Corner is solved",
    "Pair in wrong slot",
    "Flipped edge & corner in adjacent slot",
    "Other easy cases",
  ],
  categoryCases: [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9],
    [10, 11, 12, 13, 14, 15],
    [16, 17],
  ],

  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  btnChangeLearningState: [[], [], []],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
  btnContainer: [],
  btnMirror: [],
  imgMirror: [],
  flagMirrored: [],
  btnEdit: [],
  imgEdit: [],
  btnDelete: [],
  imgTrash: [],
  trashElementContainer: [],
  caseNumberTrash: [],
  imgContainerTrash: [],
  imgCaseTrash: [],
  btnRecover: [],
  piecesToHide: [4, 4, 2, 2, 2, 2, 2, 4, 1, 2, 4, 2, 4, 2, 4, 2, 4],
  // 1: hide red-green
  // 2: hide red-blue
  // 3: hide blue-orange
  // 4: hide green-orange
  // default: show all F2L
};

const GROUPS = [BASIC_COLLECTION, BASIC_BACK_COLLECTION, ADVANCED_COLLECTION, EXPERT_COLLECTION];
