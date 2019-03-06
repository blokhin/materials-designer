import React from "react";
import _ from "underscore";
import lodash from "lodash";
import {Made} from "made.js";
import logger from "redux-logger";
import {connect} from "react-redux";
import {ActionCreators} from 'redux-undo';
import {createStore, applyMiddleware} from "redux";

import ReduxProvider from "./utils/react/provider";
import {createMaterialsDesignerReducer} from "./reducers";
import MaterialsDesignerComponent from "./MaterialsDesigner";
import {
    updateOneMaterial, updateNameForOneMaterial, cloneOneMaterial, updateMaterialsIndex,
    addMaterials, removeMaterials, exportMaterials, saveMaterials, generateSupercellForOneMaterial,
    generateSurfaceForOneMaterial, resetState,
} from "./actions";

// bootstrap needs to be loaded first
import 'bootstrap/dist/css/bootstrap.css';
import './stylesheets/main.scss';

const initialState = () => {
    return {
        // TODO: (account && account.defaultMaterial) || Material.createDefault();
        materials: Array(1).fill(new Made.Material(Made.defaultMaterialConfig)),
        index: 0,
        isLoading: false,
        // TODO: account && account.serviceLevel.privateDataAllowed
        isSetPublicVisible: false,
    }
};

const mapStateToProps = (state, ownProps) => {
    // handle redux-undo modifications to state
    state = state.present;
    return Object.assign({}, {
        index: state.index,
        material: state.materials ? state.materials[state.index] : null,
        materials: state.materials,
        editable: lodash.get(state, 'editable', false),
        isLoading: state.isLoading,
        isSetPublicVisible: state.isSetPublicVisible,
    }, ownProps.parentProps);
};

const mapDispatchToProps = (dispatch) => {
    return {
        // Material
        onUpdate: (material, index) => (dispatch(updateOneMaterial(material, index))),
        onNameUpdate: (name, index) => (dispatch(updateNameForOneMaterial(name, index))),
        onItemClick: (index) => (dispatch(updateMaterialsIndex(index))),

        // Toolbar
        onAdd: (materials, addAtIndex) => dispatch(addMaterials(materials, addAtIndex)),
        onRemove: (indices) => (dispatch(removeMaterials(indices))),
        onExport: (format, useMultiple) => (dispatch(exportMaterials(format, useMultiple))),
        onSave: (...args) => (dispatch(saveMaterials(...args, dispatch))),

        onGenerateSupercell: (matrix) => (dispatch(generateSupercellForOneMaterial(matrix))),
        onGenerateSurface: (config) => (dispatch(generateSurfaceForOneMaterial(config))),

        // Undo-Redo
        onUndo: () => dispatch(ActionCreators.undo()),
        onRedo: () => dispatch(ActionCreators.redo()),
        onReset: () => dispatch(resetState(initialState())),
        onClone: () => dispatch(cloneOneMaterial()),

    }
};

const MaterialsDesignerContainerHelper = connect(
    mapStateToProps,
    mapDispatchToProps
)(MaterialsDesignerComponent);

export class MaterialsDesignerContainer extends React.Component {

    constructor(props) {
        super(props);
        const reducer = createMaterialsDesignerReducer(initialState());
        // TODO: Meteor.settings.public.isProduction ? undefined
        this.store = createStore(reducer, applyMiddleware(logger));
        this.container = MaterialsDesignerContainerHelper;
    }

    render() {
        const props = _.omit(this.props, "component");
        return (
            <ReduxProvider
                {...props}
                container={this.container}
                store={this.store}
            />
        )
    }

}

MaterialsDesignerContainer.propTypes = {
    childrenProps: React.PropTypes.object,
};

MaterialsDesignerContainer.defaultProps = {};
