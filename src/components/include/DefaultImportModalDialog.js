import React from 'react';
import _ from 'underscore';
import {Made} from "@exabyte-io/made.js";
import {ModalHeader, ModalBody} from 'react-bootstrap';


import {Material} from "../../material";
import {ModalDialog} from './ModalDialog';
import BasisText from "../source_editor/BasisText";


export const defaultXYZMaterialConfig = {
    name: 'Custom XYZ',
    basis: {
        elements: [
            {
                id: 1,
                value: 'H'
            }
        ],
        coordinates: [
            {
                id: 1,
                value: [
                    0.00,
                    0.00,
                    0.00
                ]
            }
        ],
        units: Made.ATOMIC_COORD_UNITS.cartesian
    },
    lattice: {
        type: Made.LATTICE_TYPE_CONFIGS[1].code, // FCC, to be exported by made.js
        a: 500.0, // NB will be rewritten with mockLatticeConstant
        b: 500.0,
        c: 500.0,
        alpha: 90,
        beta: 90,
        gamma: 90,
        units: {
            length: Made.units.angstrom,
            angle: Made.units.degree
        }
    }
};

const mockLatticeConstantMultiplicator = 2.0;

class DefaultImportModalDialog extends ModalDialog {

    constructor(props) {
        super(props);
        this.state = {
            xyz: "Paste your XYZ"
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFileRead = this.handleFileRead.bind(this);

        this.reader = new FileReader();
        this.reader.onloadend = this.handleFileRead;
    }

    handleFileRead(evt) {
        this.setState({xyz: evt.target.result});
    }

    handleSubmit() {

        if (!this.BasisTextComponent.state.isContentValidated) return;

        const basisConfig = Made.parsers.xyz.toBasisConfig(this.state.xyz, Made.ATOMIC_COORD_UNITS.cartesian);

        // determine the max distance to use for cell for user's XYZ
        const x = [],
            y = [],
            z = [];
        basisConfig.coordinates.forEach(function(item){
            x.push(item.value[0]);
            y.push(item.value[1]);
            z.push(item.value[2]);
        });

        const diffX = _.max(x) - _.min(x),
            diffY = _.max(y) - _.min(y),
            diffZ = _.max(z) - _.min(z);
        const mockLatticeConstant = _.max([diffX, diffY, diffZ]) * mockLatticeConstantMultiplicator;

        const material = new Made.Material(defaultXYZMaterialConfig);

        const latticeConfig = Object.assign({}, material.lattice, {
            a: mockLatticeConstant,
            b: mockLatticeConstant,
            c: mockLatticeConstant
        });
        const lattice = new Made.Lattice(latticeConfig);

        const basis = new Made.Basis({
            ...basisConfig,
            cell: lattice.vectorArrays
        });

        const newMaterialConfig = Object.assign({},
            material.toJSON(),
            {
                basis: basis.toJSON(),
                lattice: lattice.toJSON(),
                name: `${material.name} - ${basis.formula}`
            }
        );
        const newMaterial = new Material(newMaterialConfig);
        newMaterial.cleanOnCopy();

        this.props.onSubmit([newMaterial]);
    }

    handleChange(content) {
        this.setState({xyz: content});
    }

    handleFileChange(files) {
        if (!files[0] || !files[0].size) return alert("Error: file cannot be read (unaccessible?)");
        this.reader.currentFilename = files[0].name;
        this.reader.readAsText(files[0]);
    }

    renderHeader() {
        return (
            <ModalHeader className="bgm-dark" closeButton={true}>
                <h4 className="modal-title">{this.props.title}
                    <a className="m-l-10 combinatorial-info"
                        href="https://docs.exabyte.io/materials-designer/header-menu/advanced/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i className="zmdi zmdi-info"/>
                    </a>
                </h4>
            </ModalHeader>
        )
    }

    renderBody() {
        return (
            <ModalBody className="bgm-dark">
                <BasisText
                    ref={(el) => {this.BasisTextComponent = el}}
                    className="combinatorial-basis"
                    content={this.state.xyz}
                    onChange={this.handleChange}
                />
                <input type="file"
                    id="fileapi"
                    onChange={(event) => this.handleFileChange(event.target.files)}
                />

                <div className="row m-t-10">
                    <div className="col-md-12">
                        <button id="generate-combinatorial" className="btn btn-custom btn-block"
                            onClick={this.handleSubmit}>Submit your XYZ
                        </button>
                    </div>
                </div>
            </ModalBody>
        );
    }

    renderFooter() {return null}
}

DefaultImportModalDialog.PropTypes = {
    onSubmit: React.PropTypes.func,
    material: React.PropTypes.object,
};

export default DefaultImportModalDialog;
