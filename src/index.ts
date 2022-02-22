import UndoBox from './UndoBox'
import Vue from "vue";

export const undoBox = function (
    this: Vue,
    {
        key,
        autoBox = true,
        autoHandleData = true,
        callback
    }: {
        key: string,
        autoBox?: boolean,
        autoHandleData?: boolean,
        callback?: (data: {}) => void
    }
) {
    return new UndoBox({
        key,
        autoBox,
        autoHandleData,
        callback,
        vm: this
    })
}

const install = function (Vue: any, opts: {}) {
    Vue.prototype.$undoBox = undoBox
}

export default {
    install
}