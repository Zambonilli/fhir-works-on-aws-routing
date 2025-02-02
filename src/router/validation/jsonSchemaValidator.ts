/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv';
// @ts-ignore
import schemaDraft06 from 'ajv/lib/refs/json-schema-draft-06.json';
import schemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';

// @ts-ignore
import { FhirVersion, InvalidResourceError, Validator } from 'fhir-works-on-aws-interface';
import fhirV4Schema from './schemas/fhir.schema.v4.json';
import fhirV3Schema from './schemas/fhir.schema.v3.json';

export default class JsonSchemaValidator implements Validator {
    private ajv: any;

    private readonly schemaId: string;

    constructor(fhirVersion: FhirVersion) {
        const ajv = new Ajv({ schemaId: 'auto', allErrors: true });
        let schema;
        if (fhirVersion === '4.0.1') {
            ajv.addMetaSchema(schemaDraft06);
            ajv.compile(fhirV4Schema);
            schema = fhirV4Schema;
        } else if (fhirVersion === '3.0.1') {
            ajv.addMetaSchema(schemaDraft04);
            ajv.compile(fhirV3Schema);
            schema = fhirV3Schema;
        }
        this.schemaId = schema && 'id' in schema ? schema.id : '';
        this.ajv = ajv;
    }

    async validate(resource: any): Promise<void> {
        const definitionName = resource.resourceType;
        if (!definitionName) {
            throw new InvalidResourceError("resource should have required property 'resourceType'");
        }
        const referenceName = `${this.schemaId}#/definitions/${definitionName}`;
        const result = this.ajv.validate(referenceName, resource);
        if (!result) {
            throw new InvalidResourceError(
                `Failed to parse request body as JSON resource. Error was: ${this.ajv.errorsText()}`,
            );
        }
    }
}
