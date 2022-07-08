
export function isOrdered(array: number[], asc: boolean): boolean {
    var sorted = true
    var index = 0
    var current
    var nextItem
    while (sorted && index < array.length - 1) {
        current = array[index]
        nextItem = array[index + 1]
        sorted = asc ? current < nextItem : current > nextItem;
        index++
    }
    return sorted
}
