import { NurseAssignments } from "../types/types"

export const sortNursesByPatientCount = (nurses: string[], nurseAssignments: NurseAssignments, direction: 'asc' | 'desc') => {
    switch (direction) {
        case 'asc':
            return [...nurses].sort((a, z) =>
                (nurseAssignments[a] ? Object
                    .entries(nurseAssignments[a])
                    .map(([_, provider]) => provider)
                    .reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0)
                -
                (nurseAssignments[z] ? Object
                    .entries(nurseAssignments[z])
                    .map(([_, provider]) => provider)
                    .reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0))
        case 'desc':
            return [...nurses].sort((a, z) =>
                (nurseAssignments[z] ? Object
                    .entries(nurseAssignments[z])
                    .map(([_, provider]) => provider)
                    .reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0)
                -
                (nurseAssignments[a] ? Object
                    .entries(nurseAssignments[a])
                    .map(([_, provider]) => provider)
                    .reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0))
    }
}
