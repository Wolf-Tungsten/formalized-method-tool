const ops = ["^", "V", "X", "R", "U"];

const trimParentheses = (fai) => {
    let trimParentheses_ = fai;
    while (trimParentheses_.startsWith("(") && trimParentheses_.endsWith(")")) {
      let tr = trimParentheses_.slice(1, trimParentheses_.length - 1);
      if(tr.indexOf('(') === -1 && tr.indexOf(')') === -1){
          trimParentheses_ = tr
      } else {
          break
      }
    }
    return trimParentheses_
}
const isAtomicP = (fai) => {
  fai = trimParentheses(fai)
  for (const op of ops) {
    if (fai.indexOf(op) !== -1) {
      return false;
    }
  }
  return true;
};

const findTopOp = (fai) => {
  fai = trimParentheses(fai)
  let depth = 0;
  for (let i = 0; i < fai.length; i++) {
    const c = fai[i];
    if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth--;
    } else if (ops.indexOf(c) !== -1) {
      if (depth === 0) {
        return {
          fai0: trimParentheses(fai.slice(0, i)),
          op: c,
          fai1: trimParentheses(fai.slice(i + 1, fai.length)),
        };
      }
    }
  }
};

let nextStateNum = 1;

const updateStateTree = (stateTree, parent, child) => {
  if (!stateTree["" + parent]) {
    stateTree["" + parent] = [];
  }
  stateTree["" + parent].push("" + child);
};

const replaceState = (states, stateTree) => {
  let newState = [];
  for (let i in states) {
    let state = states[i];
    if (
      !state.isReplaced &&
      !state.isNewed &&
      !state.isRepeat &&
      state.b.length > 0
    ) {
      const b0 = state.b[0];
      const parentS = state.s;
      if (isAtomicP(b0)) {
        newState.push({
          s: ++nextStateNum,
          a: state.a.slice(0),
          b: state.b.slice(1),
          c: [b0].concat(state.c.slice(0)),
          d: state.d.slice(0),
          isReplaced: false,
        });
        updateStateTree(stateTree, parentS, nextStateNum);
      } else {
        const { fai0, op, fai1 } = findTopOp(b0);
        if (op === "V") {
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai0].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai1].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
        } else if (op === "^") {
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai0, fai1].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
        } else if (op === "X") {
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [].concat(state.b.slice(1)),
            c: [b0].concat(state.c),
            d: [fai1].concat(state.d.slice(0)),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
        } else if (op === "U") {
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai1].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai0].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0).concat([b0]),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
        } else if (op === "R") {
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai1, fai0].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
          newState.push({
            s: ++nextStateNum,
            a: state.a.slice(0),
            b: [fai1].concat(state.b.slice(1)),
            c: [b0].concat(state.c.slice(0)),
            d: state.d.slice(0).concat([b0]),
            isReplaced: false,
          });
          updateStateTree(stateTree, parentS, nextStateNum);
        }
      }
      states[i].isReplaced = true;
    }
  }
  return newState;
};

const createNewState = (states, stateTree) => {
  let newState = [];
  for (let i in states) {
    let state = states[i];
    if (
      !state.isReplaced &&
      !state.isNewed &&
      !state.isRepeat &&
      state.b.length === 0
    ) {
      newState.push({
        s: ++nextStateNum,
        a: [state.s],
        b: state.d.slice(0),
        c: [],
        d: [],
        isReplaced: false,
      });
      //updateStateTree(stateTree, state.s, nextStateNum);
      states[i].isNewed = true;
    }
  }
  return newState;
};

const stateHash = (state) => {
  return [
    state.b.sort().join("-"),
    state.c.sort().join("-"),
    state.d.sort().join("-"),
  ].join("|");
};

const checkRepeat = (repeatRecord, newStates) => {
  for (let i in newStates) {
    if (repeatRecord[stateHash(newStates[i])]) {
      newStates[i].isRepeat = true;
      repeatRecord[stateHash(newStates[i])].push("" + newStates[i].s);
    } else {
      repeatRecord[stateHash(newStates[i])] = ["" + newStates[i].s];
    }
  }
};

const mergeA = (a1, a2) => {
    let newA1 = a1.slice(0)
    a2.forEach( s => {
        if(newA1.indexOf(s) === -1){
            newA1.push(s)
        }
    })
    return newA1
}

const mergeRepeatTree = (states, stateTree, rootIndex, a) => {
    states[rootIndex - 1].a = mergeA(states[rootIndex - 1].a, a)
    let child = stateTree[''+rootIndex]
    if(!child){
        return
    }
    child.forEach(c => {
        mergeRepeatTree(states, stateTree, +c, a)
    })
}

const mergeRepeat = (states, stateTree, repeatRecord) => {
    states.filter( (state) => {
        return state.isRepeat
    }).forEach(state => {
        // 1.从 repeatRecord 中找出重复的状态
        const repeatStates = repeatRecord[stateHash(state)]
        // 2.执行树便利，把重复状态的 a 合并进去
        repeatStates.forEach(rs => {
            mergeRepeatTree(states, stateTree, rs, state.a)
        })
    });
}

const merge = (states) => {
    const finalHashMap = {}
    states.filter(s => {
        return (!s.isReplaced && !s.isRepeat)
    }).forEach(s => {
        const sh = stateHash(s)
        if(!finalHashMap[sh]){
            finalHashMap[sh] = []
        }
        finalHashMap[sh].push(s)
    })
    const finalStates = []
    for(let sh in finalHashMap){
        for(let i = 1; i < finalHashMap[sh].length; i++){
            finalHashMap[sh][0].a = mergeA(finalHashMap[sh][0].a, finalHashMap[sh][i].a)
        }
        finalStates.push(finalHashMap[sh][0])
    }
    return finalStates
}

const main = (fai) => {
  let states = [
    {
      s: 1,
      a: ["@"],
      b: [fai],
      c: [],
      d: [],
    },
  ];

  let stateTree = {};
  let repeatRecord = {};

  checkRepeat(repeatRecord, states);
  let newStates;
  do {
    do {
      newStates = replaceState(states, stateTree);
      checkRepeat(repeatRecord, newStates);
      //console.log(newStates)
      states = states.concat(newStates);
    } while (newStates.length > 0);
    newStates = createNewState(states, stateTree);
    checkRepeat(repeatRecord, newStates);
    states = states.concat(newStates);
  } while (newStates.length > 0);
  
  mergeRepeat(states, stateTree, repeatRecord)
  
  let finalStates = merge(states)
  console.log(finalStates)
};

main("(Xp)^(qRr)");

