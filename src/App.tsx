import React, { useState, useEffect } from 'react'
import { RiFlagFill, RiFloodFill, RiQuestionFill } from 'react-icons/ri'
import { FaQuestion } from 'react-icons/fa'
import { FaBomb } from 'react-icons/fa'
import { BsTwitter } from 'react-icons/bs'

const createGrid = (rows: number, cols: number) => {
    const grid: number[] = []
    for (let i = 0; i < rows * cols; i++) {
        grid.push(0)
    }
    return grid
}

function App() {
    const [grid, setGrid] = useState<number[]>([])
    const [mines, setMines] = useState<number[]>([])
    const [neighbors, setNeighbors] = useState<number[]>([])
    const [gameOver, setGameOver] = useState<boolean>(false)
    const [minesLeft, setMinesLeft] = useState<number>(10)
    const [clicks, setClicks] = useState<number>(0)

    const [firstClick, setFirstClick] = useState<boolean>(false)

    enum Marker {
        Empty = 0,
        Mine = 1,
        Flag = 2,
        Question = 3,
        Clicked = 4,
        Mineclicked = 5,
    }

    useEffect(() => {
        reset()
    }, [])

    const reset = () => {
        const newGrid = createGrid(8, 8)
        setGrid(newGrid)
        setMines(newGrid)
        setNeighbors(newGrid)
        setFirstClick(false)
        setGameOver(false)
        setMinesLeft(10)
        setClicks(0)
    }

    const getNeighbors = (array: number[], index: number): number[] => {
        const neighbors: number[] = []
        const row = Math.floor(index / 8)
        const col = index % 8

        // top left
        if (row > 0 && col > 0) {
            neighbors.push(array[index - 9])
        }
        // top
        if (row > 0) {
            neighbors.push(array[index - 8])
        }
        // top right
        if (row > 0 && col < 7) {
            neighbors.push(array[index - 7])
        }
        // left
        if (col > 0) {
            neighbors.push(array[index - 1])
        }
        // right
        if (col < 7) {
            neighbors.push(array[index + 1])
        }
        // bottom left
        if (row < 7 && col > 0) {
            neighbors.push(array[index + 7])
        }
        // bottom
        if (row < 7) {
            neighbors.push(array[index + 8])
        }
        // bottom right
        if (row < 7 && col < 7) {
            neighbors.push(array[index + 9])
        }
        return neighbors
    }

    /* calculates the number of mines surrounding each square */
    const calculateNeighbors = (array: number[]): number[] => {
        const newGrid = [...array]
        for (let i = 0; i < array.length; i++) {
            if (array[i] === 1) {
                newGrid[i] = 99
                continue
            }
            const neighbors = getNeighbors(array, i)

            neighbors.forEach((neighbor) => {
                if (neighbor !== 0) {
                    newGrid[i]++
                }
            })
            // }
        }
        setNeighbors(newGrid)
        return newGrid
    }

    const placeMines = (clickedIndex: number): number[] => {
        // set mines
        const numMines = 10
        let minesPlaced = 0
        const newGrid = [...mines]

        while (minesPlaced < numMines) {
            const index = Math.floor(Math.random() * newGrid.length)

            // don't place mines on the squar first clicked, nor the surrounding 8 squares
            if (
                newGrid[index] === 0 &&
                index !== clickedIndex &&
                index !== clickedIndex - 1 &&
                index !== clickedIndex + 1 &&
                index !== clickedIndex - 8 &&
                index !== clickedIndex + 8 &&
                index !== clickedIndex - 9 &&
                index !== clickedIndex + 9 &&
                index !== clickedIndex - 7 &&
                index !== clickedIndex + 7
            ) {
                newGrid[index] = 1
                minesPlaced++
            }
        }
        return newGrid
    }

    // when a mine is clicked, reveal all other mines
    const markOtherMines = (array: number[]) => {
        const newGrid = [...array]
        for (let i = 0; i < grid.length; i++) {
            if (mines[i] === 1 && newGrid[i] !== Marker.Mineclicked) {
                newGrid[i] = Marker.Mine
            }
        }
        setGrid(newGrid)
    }

    // when an empty square is clicked, reveal all surrounding empty squares
    const floodFill = (array: number[], neighborsArray: number[], index: number, rows: number, cols: number) => {
        const col = index % cols
        if (index < 0 || index >= rows * cols) return
        if (array[index] === Marker.Clicked) return
        if (neighborsArray[index] === 99) return
        if (array[index] === Marker.Flag) return
        // if (array[index] === Marker.Question) return
        if (array[index] === Marker.Mineclicked) return

        if (neighborsArray[index] !== 0) {
            array[index] = Marker.Clicked
            return
        }
        array[index] = Marker.Clicked

        if (col > 0) floodFill(array, neighborsArray, index - 1, rows, cols)
        if (col < cols - 1) floodFill(array, neighborsArray, index + 1, rows, cols)
        floodFill(array, neighborsArray, index - rows, rows, cols)
        floodFill(array, neighborsArray, index + rows, rows, cols)
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
        e.preventDefault()
        setClicks(clicks + 1)
        if (gameOver) return
        const newGrid = [...grid]
        let tempNeighbors: number[] = [...neighbors]

        // first click, place mines and calculate neighbors
        if (!firstClick) {
            setFirstClick(true)
            const minesArray = placeMines(index)
            setMines(minesArray)
            tempNeighbors = calculateNeighbors(minesArray)
        }

        if (e.type === 'click') {
            if (neighbors[index] === 99) {
                // mine clicked
                newGrid[index] = Marker.Mineclicked
                markOtherMines(newGrid)
                setGameOver(true)
                return
            } else {
                floodFill(newGrid, tempNeighbors, index, 8, 8)
                setGrid(newGrid)
            }
        } else {
            // right click
            if (newGrid[index] === Marker.Clicked) return // don't change if clicked
            // change marker to flag, question mark, or empty
            if (newGrid[index] === Marker.Flag) {
                newGrid[index] = Marker.Question
            } else if (newGrid[index] === Marker.Question) {
                newGrid[index] = Marker.Empty
            } else {
                newGrid[index] = Marker.Flag
            }
        }

        setGrid(newGrid)
    }

    // maps tile type to a CSS class
    const getFlagCSS = (array: number[], index: number) => {
        if (array[index] === Marker.Empty) return 'empty'
        if (array[index] === Marker.Mine) return 'mine'
        if (array[index] === Marker.Mineclicked) return 'mine-clicked'
        if (array[index] === Marker.Flag) return 'flag'
        if (array[index] === Marker.Question) return 'question'
        if (array[index] === Marker.Clicked) return 'clicked'
        return ''
    }

    const neighborText = (numNeighbors: number): string => {
        if (numNeighbors === 0) return ''
        return numNeighbors.toString()
    }

    return (
        <div className="main">
            <h1>
                <FaBomb />
                Mine Sweeper
            </h1>
            <div className="topbar">
                <div title="Mines left">{minesLeft}</div>
                <button onClick={reset}>Reset</button>
                <div title="Number of clicks">{clicks}</div>
            </div>
            <div className="container">
                {grid.map((item, index) => {
                    return (
                        <div
                            className={`grid-item ${getFlagCSS(grid, index)}`}
                            key={index}
                            onClick={(e) => handleClick(e, index)}
                            onContextMenu={(e) => handleClick(e, index)}
                        >
                            {item === 4 && <div className="number">{neighborText(neighbors[index])}</div>}
                            {(item === Marker.Mineclicked || item === Marker.Mine) && <FaBomb />}
                            {item === 2 && <RiFlagFill />}
                            {item === 3 && <FaQuestion />}
                        </div>
                    )
                })}
            </div>
            <div className="footer">
                <a href="https://twitter.com/devbit01">
                    <BsTwitter />
                    twitter/devbit01
                </a>
            </div>
        </div>
    )
}

export default App
