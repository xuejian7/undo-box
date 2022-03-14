import UndoBox from './UndoBox'
import Vue from "vue";


export const undoBox = function (this: Vue,
                                 {
                                     size = 100
                                 }: {
                                     size: number
                                 }
) {
    return new UndoBox(this, size)
}

const install = function (Vue: any, opts: {}) {
    Vue.prototype.$undoBox = undoBox
}

export default {
    install
}