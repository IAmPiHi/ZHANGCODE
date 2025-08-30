let karelX, karelY, karelDir; // Karel position and direction (0: East, 1: North, 2: West, 3: South)
let worldWidth = 10, worldHeight = 10; // Initial world size
let walls = []; // Wall positions
// --- 修正: Beeper 的資料結構，現在每個位置可以有多個 Beeper
let beepers = {}; // Store beepers as a map: { 'x,y': count }
// ---
let cellSize = 50; // Cell size in pixels
let mode = 'drag'; // Current mode: drag, place-wall, place-beeper
let isDragging = false; // Whether Karel is being dragged
let instructions = []; // Array of preprocessed instructions
let currentInstructionIndex = 0; // Current instruction index
let variables = {}; // Store all variables
let isExecuting = false; // Execution state
let stepCount = 0; // Track steps for status messages
let loopCounter = 0; // For generating unique loop labels

function setup() {
  let canvas = createCanvas(worldWidth * cellSize, worldHeight * cellSize);
  canvas.parent('canvas-container');
  
  resetWorld();
}

function resetWorld() {
  worldWidth = parseInt(document.getElementById('world-width').value) || 10;
  worldHeight = parseInt(document.getElementById('world-height').value) || 10;
  if (worldWidth < 5 || worldWidth > 20 || worldHeight < 5 || worldHeight > 20) {
    alert('World 大小必須在 5 到 20 之間！');
    worldWidth = 10;
    worldHeight = 10;
  }
  resizeCanvas(worldWidth * cellSize, worldHeight * cellSize);
  karelX = 0;
  karelY = worldHeight - 1;
  karelDir = 0; // Initial direction: East
  walls = [];
  // --- 修正: 重設 Beeper 資料結構
  beepers = {};
  // ---
  variables = { karelX, karelY, karelDir };
  updateVariablesDisplay();
  updateStatus('World 已重設');
  stopExecution();
}

function draw() {
  background(255);
  // Draw grid
  stroke(0);
  noFill();
  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      rect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  // Draw walls
  fill(100);
  noStroke();
  for (let wall of walls) {
    rect(wall.x * cellSize, wall.y * cellSize, cellSize, cellSize);
  }
  // --- 修正: 繪製 Beeper 時，根據數量來繪製和顯示數字
  for (let pos in beepers) {
    let count = beepers[pos];
    if (count > 0) {
      let coords = pos.split(',').map(Number);
      let x = coords[0];
      let y = coords[1];

      fill(255, 155, 0);
      noStroke();
      ellipse((x + 0.5) * cellSize, (y + 0.5) * cellSize, cellSize / 2, cellSize / 2);
      
      // 繪製數量
      fill(0);
      textSize(cellSize / 3);
      textAlign(CENTER, CENTER);
      text(count, (x + 0.5) * cellSize, (y + 0.5) * cellSize);
    }
  }
  // ---
  // Draw Karel (Pac-Man style)
  fill(0, 0, 255);
  noStroke();
  let karelCenterX = (karelX + 0.5) * cellSize;
  let karelCenterY = (karelY + 0.5) * cellSize;
  let radius = cellSize / 2.5;
  let mouthAngle = PI / 4;
  let startAngle, endAngle;
  if (karelDir === 0) { // East
    startAngle = mouthAngle / 2;
    endAngle = TWO_PI - mouthAngle / 2;
  } else if (karelDir === 1) { // North
    startAngle = -PI / 2 + mouthAngle / 2;
    endAngle = -PI / 2 - mouthAngle / 2 + TWO_PI;
  } else if (karelDir === 2) { // West
    startAngle = PI + mouthAngle / 2;
    endAngle = PI - mouthAngle / 2;
  } else { // South
    startAngle = PI / 2 + mouthAngle / 2;
    endAngle = PI / 2 - mouthAngle / 2 + TWO_PI;
  }
  arc(karelCenterX, karelCenterY, radius * 2, radius * 2, startAngle, endAngle, PIE);
}

// --- 修正: mousePressed() 函式，用於手動增加/減少 Beeper
function mousePressed() {
  if (isExecuting) return;
  let gridX = floor(mouseX / cellSize);
  let gridY = floor(mouseY / cellSize);
  if (gridX < 0 || gridX >= worldWidth || gridY < 0 || gridY >= worldHeight) return;

  if (mode === 'drag' && gridX === karelX && gridY === karelY) {
    isDragging = true;
  } else if (mode === 'place-wall') {
    let wallIndex = walls.findIndex(w => w.x === gridX && w.y === gridY);
    if (wallIndex === -1) {
      walls.push({ x: gridX, y: gridY });
    } else {
      walls.splice(wallIndex, 1);
    }
  } else if (mode === 'place-beeper') {
    let posKey = `${gridX},${gridY}`;
    // 檢查是左鍵還是右鍵
    if (mouseButton === LEFT) {
      // 左鍵: 增加 Beeper
      beepers[posKey] = (beepers[posKey] || 0) + 1;
    } else if (mouseButton === RIGHT) {
      // 右鍵: 減少 Beeper，但數量不能小於 0
      if (beepers[posKey] > 0) {
        beepers[posKey]--;
      }
    }
  }
  updateVariablesDisplay();
}

// --- 新增: mouseReleased() 和 mouseDragged() 不變，因為 Beeper 邏輯在 mousePressed() 中處理
function mouseReleased() {
  isDragging = false;
}

function mouseDragged() {
  if (isExecuting) return;
  if (mode === 'drag' && isDragging) {
    let gridX = floor(mouseX / cellSize);
    let gridY = floor(mouseY / cellSize);
    if (gridX >= 0 && gridX < worldWidth && gridY >= 0 && gridY < worldHeight) {
      if (!walls.some(w => w.x === gridX && w.y === gridY)) {
        karelX = gridX;
        karelY = gridY;
        variables.karelX = karelX;
        variables.karelY = karelY;
        updateVariablesDisplay();
      }
    }
  }
}
// ---

// --- 新增: 禁止右鍵選單
document.addEventListener('contextmenu', event => event.preventDefault());
// ---

function updateStatus(message) {
  document.getElementById('status').innerText = message;
}
function updatecodeStatus(message) {
  document.getElementById('codestatus').innerText = message;
}

function updateVariablesDisplay() {
  let display = `karelX: ${karelX}\nkarelY: ${karelY}\nkarelDir: ${karelDir} (${['東', '北', '西', '南'][karelDir]})\n`;
  for (let key in variables) {
    if (!['karelX', 'karelY', 'karelDir'].includes(key)) {
      display += `${key}: ${variables[key]}\n`;
    }
  }
  document.getElementById('variables-display').innerText = display;
}

function moveKarel() {
  let newX = karelX, newY = karelY;
  if (karelDir === 0) newX++; // East
  else if (karelDir === 1) newY--; // North
  else if (karelDir === 2) newX--; // West
  else newY++; // South
  if (newX < 0 || newX >= worldWidth || newY < 0 || newY >= worldHeight) {
    updateStatus('錯誤：Karel 不能移動到 World 外！');
    return false;
  }
  if (walls.some(w => w.x === newX && w.y === newY)) {
    updateStatus('錯誤：Karel 撞到牆壁！');
    return false;
  }
  karelX = newX;
  karelY = newY;
  variables.karelX = karelX;
  variables.karelY = karelY;
  updateStatus('Karel 已移動');
  updateVariablesDisplay();
  return true;
}

function turnLeft() {
  karelDir = (karelDir + 1) % 4;
  variables.karelDir = karelDir;
  updateStatus('Karel 已左轉');
  updateVariablesDisplay();
  return true;
}

// --- 修正: putBeeper()，增加 Beeper 數量
function putBeeper() {
  let posKey = `${karelX},${karelY}`;
  beepers[posKey] = (beepers[posKey] || 0) + 1;
  updateStatus('放置 Beeper 成功');
  updateVariablesDisplay();
  return true;
}
// ---

// --- 修正: pickBeeper()，減少 Beeper 數量
// --- 修正: pickBeeper()，減少 Beeper 數量並顯示剩餘數量
function pickBeeper() {
  let posKey = `${karelX},${karelY}`;
  if ((beepers[posKey] || 0) > 0) {
    beepers[posKey]--;
    
    // 取得新的 Beeper 數量
    let remainingBeepers = beepers[posKey] || 0; 
    updateStatus(`拾取 Beeper 成功 (剩餘: ${remainingBeepers})`); // 更新狀態訊息
    
    updateVariablesDisplay();
    return true;
  } else {
    updateStatus('錯誤：此處沒有 Beeper');
    return false;
  }
}
// ---

function frontIsClear() {
  let newX = karelX, newY = karelY;
  if (karelDir === 0) newX++;
  else if (karelDir === 1) newY--;
  else if (karelDir === 2) newX--;
  else newY++;
  return !(newX < 0 || newX >= worldWidth || newY < 0 || newY >= worldHeight ||
           walls.some(w => w.x === newX && w.y === newY));
}

// --- 修正: beepersPresent()，檢查 Beeper 數量是否大於 0
function beepersPresent() {
  let posKey = `${karelX},${karelY}`;
  return (beepers[posKey] || 0) > 0;
}
// ---

function startExecution() {
  if (isExecuting) {
    updatecodeStatus('程式已在執行中');
    return;
  }
  let codeLines = document.getElementById('code-editor').value.split('\n').filter(line => line.trim());
  if (codeLines.length === 0) {
    updatecodeStatus('錯誤：程式碼為空');
    return;
  }
  instructions = preprocessCode(codeLines);
  if (instructions.some(instr => instr.type === 'error')) {
    let errorLine = instructions.find(instr => instr.type === 'error').lineNumber;
    updatecodeStatus(`錯誤：無法解析的指令 (行 ${errorLine})`);
    return;
  }
  isExecuting = true;
  document.getElementById('step-btn').disabled = false;
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('move-btn').disabled = true;
  document.getElementById('turn-left-btn').disabled = true;
  document.getElementById('put-beeper-btn').disabled = true;
  document.getElementById('pick-beeper-btn').disabled = true;
  currentInstructionIndex = 0;
  stepCount = 0;
  loopCounter = 0;
  variables = { karelX, karelY, karelDir };
  updatecodeStatus('程式開始執行');
  updateVariablesDisplay();
  stepExecution();
}

function stopExecution() {
  isExecuting = false;
  document.getElementById('step-btn').disabled = true;
  document.getElementById('stop-btn').disabled = true;
  document.getElementById('move-btn').disabled = false;
  document.getElementById('turn-left-btn').disabled = false;
  document.getElementById('put-beeper-btn').disabled = false;
  document.getElementById('pick-beeper-btn').disabled = false;
  currentInstructionIndex = 0;
  instructions = [];
  variables = { karelX, karelY, karelDir };
  stepCount = 0;
  updatecodeStatus('程式已停止');
  updateVariablesDisplay();
}

// --- 修正後的 preprocessCode() 函式 ---
function preprocessCode(codeLines) {
  let instructions = [];
  let indentationLevels = codeLines.map(line => {
    let match = line.match(/^(\s*)/);
    return match[1].length / 2; // Assume 2 spaces per indent level
  });
  let loopStack = [];
  let loopLabelCounter = 0;

  for (let i = 0; i < codeLines.length; i++) {
    let line = codeLines[i].trim();
    let indent = indentationLevels[i];
    let instruction = {
      type: '',
      line: line,
      lineNumber: i + 1,
      indent: indent,
      loopLabels: [],
      conditionIndices: []
    };

    while (loopStack.length > 0 && indent <= loopStack[loopStack.length - 1].indent) {
      loopStack.pop();
    }
    
    let rangeMatch = line.match(/^for (\w+) in range\((\d+)(?:,\s*(\d+))?(?:,\s*(-?\d+))?\):$/);

    if (line.match(/^move\(\)$/)) {
      instruction.type = 'move';
    } 
    else if (line.match(/^end$/)) {
      instruction.type = 'none';
    }
      else if (line.match(/^turn_left\(\)$/)) {
      instruction.type = 'turnLeft';
    } else if (line.match(/^put_beeper\(\)$/)) {
      instruction.type = 'putBeeper';
    } else if (line.match(/^pick_beeper\(\)$/)) {
      instruction.type = 'pickBeeper';
    } else if (line.match(/^(\w+) = (\d+)$/)) {
      instruction.type = 'assign';
      let match = line.match(/^(\w+) = (\d+)$/);
      instruction.varName = match[1];
      instruction.value = parseInt(match[2]);
    } else if (rangeMatch) {
      instruction.type = 'for';
      instruction.varName = rangeMatch[1];
      let arg1 = parseInt(rangeMatch[2]);
      let arg2 = rangeMatch[3] ? parseInt(rangeMatch[3]) : null;
      let arg3 = rangeMatch[4] ? parseInt(rangeMatch[4]) : null;

      if (arg2 === null) {
          instruction.loopStart = 0;
          instruction.loopEnd = arg1;
          instruction.step = 1;
      } else if (arg3 === null) {
          instruction.loopStart = arg1;
          instruction.loopEnd = arg2;
          instruction.step = 1;
      } else {
          instruction.loopStart = arg1;
          instruction.loopEnd = arg2;
          instruction.step = arg3;
      }

      instruction.loopLabel = `loop_${loopLabelCounter++}`;
      instruction.conditionIndex = instructions.length;
      instruction.isFirstRun = true;
      loopStack.push({
        indent: indent,
        label: instruction.loopLabel,
        conditionIndex: instructions.length,
        type: 'for'
      });
    } else if (line.match(/^while beepersPresent\(\):$/)) {
      instruction.type = 'while';
      instruction.condition = 'beepersPresent';
      instruction.loopLabel = `loop_${loopLabelCounter++}`;
      instruction.conditionIndex = instructions.length;
      loopStack.push({
        indent: indent,
        label: instruction.loopLabel,
        conditionIndex: instructions.length,
        type: 'while'
      });
    } else if (line.match(/^while frontIsClear\(\):$/)) {
      instruction.type = 'while';
      instruction.condition = 'frontIsClear';
      instruction.loopLabel = `loop_${loopLabelCounter++}`;
      instruction.conditionIndex = instructions.length;
      loopStack.push({
        indent: indent,
        label: instruction.loopLabel,
        conditionIndex: instructions.length,
        type: 'while'
      });
    } else if (line.match(/^if frontIsClear\(\):$/)) {
      instruction.type = 'if';
      instruction.condition = 'frontIsClear';
      instruction.loopLabel = `loop_${loopLabelCounter++}`;
      instruction.conditionIndex = instructions.length;
      loopStack.push({
        indent: indent,
        label: instruction.loopLabel,
        conditionIndex: instructions.length,
        type: 'if'
      });
    } else if (line.match(/^if beepersPresent\(\):$/)) {
      instruction.type = 'if';
      instruction.condition = 'beepersPresent';
      instruction.loopLabel = `loop_${loopLabelCounter++}`;
      instruction.conditionIndex = instructions.length;
      loopStack.push({
        indent: indent,
        label: instruction.loopLabel,
        conditionIndex: instructions.length,
        type: 'if'
      });
    } else {
      instruction.type = 'error';
    }

    for (let loop of loopStack) {
      if (loop.label && indent > loop.indent) {
        instruction.loopLabels.push(loop.label);
        instruction.conditionIndices.push(loop.conditionIndex);
      }
    }
    
    instructions.push(instruction);
  }

  // Mark the last instruction of each loop body
  for (let i = 0; i < instructions.length; i++) {
    if (instructions[i].loopLabels.length > 0) {
      let labels = instructions[i].loopLabels;
      
      for (let j = 0; j < labels.length; j++) {
        let currentLabel = labels[j];
        let nextInstruction = instructions[i + 1];

        if (i + 1 >= instructions.length || !nextInstruction.loopLabels.includes(currentLabel)) {
          if (!instructions[i].isLastInLoop) {
            instructions[i].isLastInLoop = {};
          }
          instructions[i].isLastInLoop[currentLabel] = instructions[i].conditionIndices[j];
        }
      }
    }
  }

  return instructions;
}

// --- 修正後的 stepExecution() 函式 ---
function stepExecution() {
  if (!isExecuting || currentInstructionIndex >= instructions.length) {
    updatecodeStatus(`執行結束 (共 ${stepCount} 步)`);
    stopExecution();
    return;
  }

  let instr = instructions[currentInstructionIndex];
  stepCount++;
  let nextIndex = currentInstructionIndex + 1;
  let statusMessage = `執行行 ${instr.lineNumber} (共 ${stepCount} 步): ${instr.line}`;
  let isLoopEndJump = false;

  // Execute the current instruction
  if (instr.type === 'move') {
    if (!moveKarel()) {
      stopExecution();
      return;
    }
  } else if (instr.type === 'turnLeft') {
    turnLeft();
  } else if (instr.type === 'putBeeper') {
    if (!putBeeper()) {
      stopExecution();
      return;
    }
  } else if (instr.type === 'pickBeeper') {
    if (!pickBeeper()) {
      stopExecution();
      return;
    }
  } else if (instr.type === 'assign') {
    variables[instr.varName] = instr.value;
    updateVariablesDisplay();
  } else if (instr.type === 'for') {
    if (instr.isFirstRun) {
      variables[instr.varName] = instr.loopStart;
      instr.isFirstRun = false;
      updateVariablesDisplay();
    }
    let conditionMet;
    if (instr.step > 0) {
      conditionMet = variables[instr.varName] < instr.loopEnd;
    } else {
      conditionMet = variables[instr.varName] > instr.loopEnd;
    }
    if (!conditionMet) {
      // Loop ends, jump past the loop body
      let loopBodyEndIndex = currentInstructionIndex;
      while (loopBodyEndIndex + 1 < instructions.length && instructions[loopBodyEndIndex + 1].indent > instr.indent) {
        loopBodyEndIndex++;
      }
      nextIndex = loopBodyEndIndex + 1;
      delete variables[instr.varName];
      instr.isFirstRun = true;
      updateVariablesDisplay();
    } else {
      statusMessage = `執行行 ${instr.lineNumber} (共 ${stepCount} 步): 進入 for 迴圈, ${instr.varName} = ${variables[instr.varName]}`;
    }
  } else if (instr.type === 'while') {
    let conditionMet = instr.condition === 'beepersPresent' ? beepersPresent() : frontIsClear();
    statusMessage = `執行行 ${instr.lineNumber} (共 ${stepCount} 步): 判斷 ${instr.line}: ${conditionMet ? '成立' : '不成立'}`;
    if (!conditionMet) {
      // Loop ends, jump past the loop body
      let loopBodyEndIndex = currentInstructionIndex;
      while (loopBodyEndIndex + 1 < instructions.length && instructions[loopBodyEndIndex + 1].indent > instr.indent) {
        loopBodyEndIndex++;
      }
      nextIndex = loopBodyEndIndex + 1;
    }
  } else if (instr.type === 'if') {
    let conditionMet = instr.condition === 'beepersPresent' ? beepersPresent() : frontIsClear();
    statusMessage = `執行行 ${instr.lineNumber} (共 ${stepCount} 步): 判斷 ${instr.line}: ${conditionMet ? '成立' : '不成立'}`;
    if (!conditionMet) {
      // If condition is false, jump past the if body
      let ifBodyEndIndex = currentInstructionIndex;
      while (ifBodyEndIndex + 1 < instructions.length && instructions[ifBodyEndIndex + 1].indent > instr.indent) {
        ifBodyEndIndex++;
      }
      nextIndex = ifBodyEndIndex + 1;
    }
  }

  // Handle the jump back to the top of a loop from within its body
  if (instr.isLastInLoop) {
    // Find the innermost loop this instruction belongs to
    let innermostLoopIndex = instr.conditionIndices[instr.loopLabels.length - 1];
    let loopInstr = instructions[innermostLoopIndex];
    let conditionMet = true;

    if (loopInstr.type === 'for') {
      variables[loopInstr.varName] += loopInstr.step;
      if (loopInstr.step > 0) {
        conditionMet = variables[loopInstr.varName] < loopInstr.loopEnd;
      } else {
        conditionMet = variables[loopInstr.varName] > loopInstr.loopEnd;
      }
    } else if (loopInstr.type === 'while') {
      conditionMet = loopInstr.condition === 'beepersPresent' ? beepersPresent() : frontIsClear();
    }

    if (conditionMet) {
      // Condition is still met, jump back to the top of this loop
      nextIndex = innermostLoopIndex + 1;
      isLoopEndJump = true;
      statusMessage = `執行行 ${instr.lineNumber} (共 ${stepCount} 步): ${instr.line} -> 回到迴圈開頭 (行 ${loopInstr.lineNumber})`;
    } else {
      // Condition is no longer met, this loop ends.
      // Continue to the next instruction after this loop's body.
      // We don't need to change `nextIndex` here as it's already set to `currentInstructionIndex + 1`
      // This will allow execution to continue to `move()` after the `for` loop
      statusMessage = `執行行 ${instr.lineNumber} (共 ${stepCount} 步): ${instr.line} -> 跳出迴圈 (行 ${loopInstr.lineNumber})`;
      if (loopInstr.type === 'for') {
        delete variables[loopInstr.varName];
        loopInstr.isFirstRun = true;
      }
    }
  }

  updateVariablesDisplay();
  updatecodeStatus(statusMessage);
  currentInstructionIndex = nextIndex;

  if (currentInstructionIndex >= instructions.length) {
    updatecodeStatus(`執行結束 (共 ${stepCount} 步)`);
    stopExecution();
  }
}

document.getElementById('mode-select').addEventListener('change', function() {
  mode = this.value;
  updateStatus('模式切換為：' + (mode === 'drag' ? '拖曳 Karel' : mode === 'place-wall' ? '放置/移除牆壁' : '放置/移除 Beeper'));
});