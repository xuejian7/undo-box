import UndoBox from './UndoBox'
import Vue from "vue";
import Type from "./UndoBoxType";
import UndoBoxPlus from "./UndoBoxPlus";

export const undoBox = function (
    this: Vue,
    {
        key,
        type = Type.AUTO,
        autoBox = true,
        autoHandleData = true,
        callback
    }: {
        key: string,
        type?: Type,
        autoBox?: boolean,
        autoHandleData?: boolean,
        callback?: (data: {}) => void
    }
) {
    return new UndoBox({
        key,
        type,
        autoBox,
        autoHandleData,
        callback,
        vm: this
    })
}

export const undoBoxPlus = function (this:Vue) {
    return new UndoBoxPlus(this)
}

const install = function (Vue: any, opts: {}) {
    Vue.prototype.$undoBox = undoBox
    Vue.prototype.$undoBoxPlus = undoBoxPlus
}

export default {
    install
}