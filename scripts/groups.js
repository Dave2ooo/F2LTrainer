const basicCollection = {
  saveName: "basic_",
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
  //
  imgPath: "./images/basic_cases/",
  numberCases: 42,

  categoryNames: [
    "Basic Inserts",
    "Pieces on Top / White facing Front / Edge oriented",
    "Pieces on Top / White facing Front / Edge unoriented",
    "Pieces on Top / White facing Side / Edge oriented",
    "Pieces on Top / white facing Side / Edge unorienteed",
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
    [10, 12, 14, 34],
    [6, 8, 16, 36],
    [17, 19, 21, 23],
    [18, 20, 22, 24],
    [32, 39, 33],
    [31, 41, 40, 42, 38, 35],
    [27, 30, 25],
    [29, 28, 26],
  ],
  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
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

const basicBackCollection = {
  saveName: "basicBack_",
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
  //
  imgPath: "./images/basic_cases_back/",
  numberCases: 42,

  categoryNames: [
    "Basic Inserts",
    "Pieces on Top / White facing Side / Edge oriented",
    "Pieces on Top / white facing Side / Edge unorienteed",
    "Pieces on Top / White facing Back / Edge oriented",
    "Pieces on Top / White facing Back / Edge unoriented",
    "Pieces on Top / White facing Up / Edge oriented",
    "Pieces on Top / White facing Up / Edge unoriented",
    "Edge solved",
    "Edge flipped",
    "Corner on Bottom / Edge on Top / Edge oriented",
    "Corner on Bottom / Edge on Top / Edge unoriented",
  ],
  categoryCases: [
    [4, 3, 1, 2],
    [9, 11, 13],
    [5, 7, 15],
    [6, 8, 16],
    [10, 12, 14],
    [18, 20, 22, 24],
    [17, 19, 21, 23],
    [32, 39, 33, 34, 40],
    [31, 41, 42, 38, 35, 36],
    [29, 28, 26],
    [27, 30, 25],
  ],
  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
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

const advancedCollection = {
  saveName: "advanced_",
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
  //
  imgPath: "./images/advanced_cases/",
  numberCases: 36,

  categoryNames: [
    "Slot in Front  / White facing Up",
    "Slot in Front / White facing Front",
    "Slot in Front / White facing Side",
    "Slot in Front / Corner in adjacent Slot",
    "Slot in Back / Corner in Front Slot",
    "Edge in Opposite Slot",
    "Corner in Opposite Slot",
  ],
  categoryCases: [
    [1, 2, 3, 4],
    [9, 10, 13, 14],
    [7, 8, 11, 12],
    [19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29],
    [5, 6, 17, 18, 15, 16],
    [31, 32, 33, 34, 35, 36],
  ],

  categoryContainer: [],
  collapseContainer: [],
  categoryCollapseImg: [],
  headingCategoryName: [],
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
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

const expertCollection = {
  saveName: "expert_",
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
  divContainer: [],
  caseNumber: [],
  imgContainer: [],
  imgCase: [],
  algorithm: [],
  divAlgorithm: [],
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

const groups = [basicCollection, basicBackCollection, advancedCollection, expertCollection];
