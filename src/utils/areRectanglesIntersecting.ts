export interface Rectangle {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function areRectanglesIntersecting(rect1: Rectangle, rect2: Rectangle): boolean {
    // Calculate the bottom and right coordinates of each rectangle
    const rect1Bottom = rect1.top + rect1.height
    const rect1Right = rect1.left + rect1.width
    const rect2Bottom = rect2.top + rect2.height
    const rect2Right = rect2.left + rect2.width

    // Check if rectangles do not overlap
    if (rect1Bottom <= rect2.top || rect1.top >= rect2Bottom || rect1Right <= rect2.left || rect1.left >= rect2Right) {
        return false
    }

    // If none of the sides from rect1 are outside rect2
    return true
}