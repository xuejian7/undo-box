import UndoBox from './UndoBox'
import Vue from "vue";


export const undoBox = function (
    {
        size
    }: {
        size: number
    } = {
        size: 100
    }
) {
    return new UndoBox(size)
}

const install = function (Vue: any, opts: {}) {
    Vue.prototype.$undoBox = undoBox
}

export default {
    install
}