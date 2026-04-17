document.addEventListener('DOMContentLoaded', () => {
    const simulateBtn = document.getElementById('simulate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const outputSection = document.getElementById('output-section');
    
    // Inputs
    const refStringInput = document.getElementById('reference-string');
    const framesInput = document.getElementById('frames');
    const algorithmSelect = document.getElementById('algorithm');
    const exampleBtn = document.getElementById('example-btn');

    // DOM Outputs
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');
    const faultsMetric = document.getElementById('faults-metric');
    const hitsMetric = document.getElementById('hits-metric');
    const hitRatioMetric = document.getElementById('hit-ratio-metric');

    simulateBtn.addEventListener('click', () => {
        runSimulation();
    });

    exampleBtn.addEventListener('click', () => {
        refStringInput.value = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';
    });

    resetBtn.addEventListener('click', () => {
        refStringInput.value = '';
        framesInput.value = 3;
        algorithmSelect.value = 'FIFO';
        outputSection.style.display = 'none';
    });

    function getReferenceString() {
        const rawValue = refStringInput.value;
        // Split by comma or space
        return rawValue.split(/[\s,]+/).filter(x => x !== '').map(Number).filter(n => !isNaN(n));
    }

    function runSimulation() {
        const refStr = getReferenceString();
        const framesCount = parseInt(framesInput.value, 10);
        const algo = algorithmSelect.value;

        if (refStr.length === 0) {
            alert('Please enter a valid Reference String.');
            return;
        }

        if (isNaN(framesCount) || framesCount < 1) {
            alert('Please enter a valid number of frames (minimum 1).');
            return;
        }

        let result;
        if (algo === 'FIFO') {
            result = simulateFIFO(refStr, framesCount);
        } else if (algo === 'LRU') {
            result = simulateLRU(refStr, framesCount);
        } else if (algo === 'OPTIMAL') {
            result = simulateOPT(refStr, framesCount);
        }

        renderResult(refStr, framesCount, result);
        
        // Show output with a smooth scroll and reset animation
        outputSection.style.display = 'block';
        outputSection.style.animation = 'none';
        outputSection.offsetHeight; /* trigger reflow */
        outputSection.style.animation = null;
    }

    /* Algorithm Implementations */
    
    function simulateFIFO(pages, framesCount) {
        let frames = []; // Represents memory
        let history = []; // To track step by step state
        let faults = 0;
        let hits = 0;

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let isFault = false;

            if (frames.includes(page)) {
                hits++;
            } else {
                faults++;
                isFault = true;
                if (frames.length < framesCount) {
                    frames.push(page);
                } else {
                    // FIFO: remove first element, push new to end
                    frames.shift();
                    frames.push(page);
                }
            }

            // Save copy for render
            history.push({
                page: page,
                frames: [...frames], // clone
                isFault: isFault
            });
        }

        return { history, faults, hits };
    }

    function simulateLRU(pages, framesCount) {
        let frames = []; 
        let history = []; 
        let faults = 0;
        let hits = 0;

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let isFault = false;

            // Find if page exists
            let index = frames.indexOf(page);

            if (index !== -1) {
                hits++;
                // Move to end (most recently used)
                frames.splice(index, 1);
                frames.push(page);
            } else {
                faults++;
                isFault = true;
                if (frames.length < framesCount) {
                    frames.push(page);
                } else {
                    // Remove first element (least recently used)
                    frames.shift();
                    frames.push(page);
                }
            }

            history.push({
                page: page,
                frames: [...frames],
                isFault: isFault
            });
        }
        return { history, faults, hits };
    }

    function simulateOPT(pages, framesCount) {
        let frames = [];
        let history = [];
        let faults = 0;
        let hits = 0;

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let isFault = false;

            if (frames.includes(page)) {
                hits++;
            } else {
                faults++;
                isFault = true;
                if (frames.length < framesCount) {
                    frames.push(page);
                } else {
                    // Find optimal page to remove
                    let farthest = -1;
                    let replaceIndex = -1;
                    
                    for (let j = 0; j < frames.length; j++) {
                        let nextUse = pages.indexOf(frames[j], i + 1);
                        if (nextUse === -1) {
                            // If never used again, this is the best one to replace
                            replaceIndex = j;
                            break;
                        } else {
                            if (nextUse > farthest) {
                                farthest = nextUse;
                                replaceIndex = j;
                            }
                        }
                    }
                    
                    frames[replaceIndex] = page;
                }
            }

            history.push({
                page: page,
                frames: [...frames],
                isFault: isFault
            });
        }

        return { history, faults, hits };
    }

    /* Rendering Logic */

    function renderResult(pages, framesCount, result) {
        const { history, faults, hits } = result;

        // Metrics update
        faultsMetric.textContent = faults;
        hitsMetric.textContent = hits;
        const total = hits + faults;
        hitRatioMetric.textContent = total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%';

        // Clear existing table
        tableHeader.innerHTML = '<th>Ref</th>';
        tableBody.innerHTML = '';

        // Build header (Pages)
        pages.forEach((p, idx) => {
            const th = document.createElement('th');
            th.textContent = p;
            th.style.animationDelay = `${idx * 0.03}s`;
            th.classList.add('animated-cell');
            tableHeader.appendChild(th);
        });

        // Add padding column to header if needed
        if (pages.length < 15) {
            // just to stretch layout slightly
            // but we use flex / fixed table layout
        }

        // Build frames rows
        // Note: 'history' frames array only has items up to what's loaded. 
        // We will display them as Frame 1, Frame 2, ...
        for (let f = 0; f < framesCount; f++) {
            const tr = document.createElement('tr');
            
            const labelTd = document.createElement('td');
            labelTd.textContent = `Frame ${f + 1}`;
            labelTd.style.fontWeight = '600';
            labelTd.style.color = 'var(--text-secondary)';
            tr.appendChild(labelTd);

            for (let i = 0; i < pages.length; i++) {
                const step = history[i];
                const td = document.createElement('td');
                
                // For LRU and FIFO, the frames array might be ordered by insertion/usage
                // For rendering, usually, we just show the array as is.
                // However, classic textbook representation places fixed frames.
                // We'll just display them in array order...
                // Actually, textbook representation keeps pages in the same "slot/frame" unless replaced.
                // Let's implement static slot rendering.

                // Because our algorithms mutate an array rather than fixed indices (except OPT),
                // we reconstruct the grid view:
            }
            // Wait, the standard array format shifts items. To make a stable grid...
        }
        
        // Better rendering approach for stable slots:
        // Let's map our frame states to stable row slots over time.

        const stableGrid = Array.from({length: framesCount}, () => new Array(pages.length).fill(null));
        const currentSlotValues = new Array(framesCount).fill(null);

        for (let i = 0; i < pages.length; i++) {
            const stepFrames = history[i].frames; // e.g. [7], [7, 0], [1, 2, 0]
            
            // To figure out which value goes into which slot:
            if (history[i].isFault) {
                // Determine which slot was changed or added
                // Find what was in currentSlotValues that is not in stepFrames (the replaced one)
                // or if there is an empty slot, put it there.
                
                let placed = false;
                // 1. Try filling empty
                if (currentSlotValues.includes(null)) {
                    let emptyIdx = currentSlotValues.indexOf(null);
                    currentSlotValues[emptyIdx] = history[i].page;
                    placed = true;
                } else {
                    // 2. Find replaced: which value is in currentSlotValues but NOT in stepFrames?
                    let replacedIdx = currentSlotValues.findIndex(v => !stepFrames.includes(v));
                    
                    if(replacedIdx === -1) {
                         // Fallback mechanism (sometimes optimal replaces something but we might lose track if duplicates exist, though theoretically not)
                         // LRU shift: the page array might reorder.
                         // But realistically: difference between old sets and new sets is 1 out and 1 in.
                         // Wait, FIFO and LRU algorithms built above use `.push` and `.splice`, which means the `frames` array elements *change their indices*.
                         // But we just need the SET of elements.
                         // Let's find exactly which element from currentSlotValues is missing in stepFrames
                         // wait, what if two pages have same value? The page reference string shouldn't have duplicate pages in memory.
                    }
                    if (replacedIdx !== -1) {
                        currentSlotValues[replacedIdx] = history[i].page;
                    }
                }
            }

            // Write currentSlotValues to the stable grid column
            for (let f = 0; f < framesCount; f++) {
                stableGrid[f][i] = currentSlotValues[f];
            }
        }

        // Build Frame Rows using stableGrid
        for (let f = 0; f < framesCount; f++) {
            const tr = document.createElement('tr');
            
            const labelTd = document.createElement('td');
            labelTd.textContent = `Frame ${f + 1}`;
            labelTd.style.fontWeight = '600';
            labelTd.style.color = 'var(--text-secondary)';
            tr.appendChild(labelTd);

            for (let i = 0; i < pages.length; i++) {
                const td = document.createElement('td');
                const val = stableGrid[f][i];

                if (val !== null) {
                    td.textContent = val;
                    td.classList.add('cell-value');
                    
                    // Add animation delay for visual cascade
                    td.style.animationDelay = `${(i * 0.05) + (f * 0.05)}s`;
                    td.classList.add('animated-cell');
                } else {
                    td.textContent = '-';
                    td.classList.add('cell-empty');
                }
                tr.appendChild(td);
            }
            tableBody.appendChild(tr);
        }

        // Build Status Row (Hit/Fault)
        const statusTr = document.createElement('tr');
        statusTr.classList.add('status-row');
        
        const statusLabelTd = document.createElement('td');
        statusLabelTd.textContent = 'Status';
        statusLabelTd.style.color = 'var(--text-secondary)';
        statusTr.appendChild(statusLabelTd);

        for (let i = 0; i < pages.length; i++) {
            const td = document.createElement('td');
            const isFault = history[i].isFault;
            
            if (isFault) {
                td.textContent = 'F';
                td.classList.add('status-fault');
            } else {
                td.textContent = 'H';
                td.classList.add('status-hit');
            }
            
            td.style.animationDelay = `${(i * 0.05) + (framesCount * 0.05)}s`;
            td.classList.add('animated-cell');
            
            statusTr.appendChild(td);
        }
        tableBody.appendChild(statusTr);
    }
});
