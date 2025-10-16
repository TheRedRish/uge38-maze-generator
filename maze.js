function randomInteger(min, max) {
    return Math.floor(Math.random() * (max + 1 - min) + min);
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = {
            top: true,
            right: true,
            bottom: true,
            left: true,
        };
        this.visited = false;
    }

    draw(ctx, cellWidth, isActive = false) {
        const px = this.x * cellWidth;
        const py = this.y * cellWidth;

        // highlight current cell
        if (this.visited) {
            ctx.fillStyle = "#cce5ff";
            ctx.fillRect(px, py, cellWidth, cellWidth);
        }
        if (isActive) {
            ctx.fillStyle = "#ff6666";
            ctx.fillRect(px, py, cellWidth, cellWidth);
        }

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (this.walls.top) { ctx.moveTo(px, py); ctx.lineTo(px + cellWidth, py); }
        if (this.walls.right) { ctx.moveTo(px + cellWidth, py); ctx.lineTo(px + cellWidth, py + cellWidth); }
        if (this.walls.bottom) { ctx.moveTo(px + cellWidth, py + cellWidth); ctx.lineTo(px, py + cellWidth); }
        if (this.walls.left) { ctx.moveTo(px, py + cellWidth); ctx.lineTo(px, py); }

        ctx.stroke();
    }

    // find naboerne i grid vha. this.x og this.y
    unvisitedNeighbors(grid) {
        let neighbors = [];

        // Vi er ikke den nordligste celle
        if (this.y > 0) {
            const nord_x = this.x;
            const nord_y = this.y - 1;
            const nord_nabo = grid[nord_x][nord_y];
            if (!nord_nabo.visited) {
                neighbors.push(nord_nabo);
            }
        }

        // Vi er ikke cellen mest til venstre
        if (this.x > 0) {
            const venstre_x = this.x - 1;
            const venstre_y = this.y;
            const venstre_nabo = grid[venstre_x][venstre_y];
            if (!venstre_nabo.visited) {
                neighbors.push(venstre_nabo);
            }
        }

        // Vi er ikke den sydligste celle
        if (this.y < grid[0].length - 1) {
            const syd_x = this.x;
            const syd_y = this.y + 1;
            const syd_nabo = grid[syd_x][syd_y];
            if (!syd_nabo.visited) {
                neighbors.push(syd_nabo);
            }
        }

        // Vi er ikke cellen mest til højre
        if (this.x < grid.length - 1) {
            const højre_x = this.x + 1;
            const højre_y = this.y;
            const højre_nabo = grid[højre_x][højre_y];
            if (!højre_nabo.visited) {
                neighbors.push(højre_nabo);
            }
        }

        return neighbors;
    }

    punchWallDown(otherCell) {
        const dx = this.x - otherCell.x;
        const dy = this.y - otherCell.y;

        if (dx === 1) {
            // otherCell er til venstre for this
            this.walls.left = false;
            otherCell.walls.right = false;
        } else if (dx === -1) {
            // otherCell er til højre for this
            this.walls.right = false;
            otherCell.walls.left = false;
        } else if (dy === 1) {
            // otherCell er over this
            this.walls.top = false;
            otherCell.walls.bottom = false;
        } else if (dy === -1) {
            // otherCell er under this
            this.walls.bottom = false;
            otherCell.walls.top = false;
        }
    }
}

class Maze {
    constructor(cols, rows, canvas) {
        this.grid = [];
        this.cols = cols;
        this.rows = rows;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellWidth = canvas.width / cols;
        this.initializeGrid();
    }

    initializeGrid() {
        for (let i = 0; i < this.rows; i += 1) {
            this.grid.push([]);
            for (let j = 0; j < this.cols; j += 1) {
                this.grid[i].push(new Cell(i, j));
            }
        }
    }

    draw(activeCell = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.rows; i += 1) {
            for (let j = 0; j < this.cols; j += 1) {
                this.grid[i][j].draw(this.ctx, this.cellWidth, this.grid[i][j] === activeCell);
            }
        }
    }

    async generateStepwise(chanceToVisitRandomCellPercent = 10, delay = 50) {
        let start_x = 0, start_y = 0;

        const startXOrY = randomInteger(0, 1);
        if (startXOrY === 0) {
            // Start ved en tilfældig celle i den øverste række eller nederste række
            start_x = randomInteger(0, this.cols - 1);
            start_y = randomInteger(0, 1) * (this.rows - 1);
            start_y > 0 ? this.grid[start_x][start_y].walls.bottom = false : this.grid[start_x][start_y].walls.top = false;
        } else {
            // Start ved en tilfældig celle i den venstre kolonne eller højre kolonne
            start_x = randomInteger(0, 1) * (this.cols - 1);
            start_y = randomInteger(0, this.rows - 1);
            start_x > 0 ? this.grid[start_x][start_y].walls.right = false : this.grid[start_x][start_y].walls.left = false;
        }

        let currentCell = this.grid[start_x][start_y];
        let stack = [];

        currentCell.visited = true;

        // Get unvisited neighbors
        // If there are unvisited neighbors:
        // - pick a random one of them
        // - carve a hole through the wall
        // - push current cell on stack
        // - make that neighbor the current cell
        // If not, make the top of stack the current cell
        // If still not, you're done

        while (currentCell != null) {
            this.draw(currentCell);
            await new Promise(r => setTimeout(r, delay));

            if (stack.length > 0 && randomInteger(0, 100) < chanceToVisitRandomCellPercent) {
                currentCell = stack[randomInteger(0, stack.length - 1)];
            }

            let unvisitedNeighbors = currentCell.unvisitedNeighbors(this.grid);
            if (unvisitedNeighbors.length > 0) {
                const randomNeighborCell = unvisitedNeighbors[randomInteger(0, unvisitedNeighbors.length - 1)];
                currentCell.punchWallDown(randomNeighborCell);
                stack.push(currentCell);
                currentCell = randomNeighborCell;
                currentCell.visited = true;
            } else {
                currentCell = stack.pop();
            }
        }

        this.draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const mazeHeight = 20, mazeWidth = 20;
    const maze = new Maze(mazeWidth, mazeHeight, canvas);
    const randomChance = 10, delay = 200;
    maze.generateStepwise(randomChance, delay);
});
