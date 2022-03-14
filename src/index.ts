import UndoBox from './UndoBox'
import Vue from "vue";


export const undoBox = function (this:Vue) {
    return new UndoBox(this)
}

const install = function (Vue: any, opts: {}) {
    Vue.prototype.$undoBox = undoBox
}

export default {
    install
}