export type Provider = {
    name: string,
    patientCount: {
        am: {
            inPerson: number,
            virtual: number
        },
        pm: {
            inPerson: number,
            virtual: number
        },
    },
}

export type ShiftSlots = {
    am: Provider | null,
    pm: Provider | null,
};
export type Rooms = Record<string, ShiftSlots>;
export type NurseAssignments = Record<string, Rooms>;

export enum ResetOptions {
    ALL,
    PROVIDERS,
}

// export enum SortOptions {
//     NONE,
//     ASCENDING_BY_PATIENT_COUNT,
//     DESCENDING_BY_PATIENT_COUNT
// }
