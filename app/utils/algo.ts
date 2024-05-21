import { NurseAssignments, Provider } from "../page";

export function autoAssigner(nurseList: string[], roomList: string[], providerList: Provider[]): NurseAssignments {
    return {
        'Elizabeth': {
            'Room A': {
                am: {
                    name: 'Doc Mike'
                    , patientCount: {
                        am: 5,
                        pm: 7
                    }
                },
                pm: {
                    name: 'Doc Mike'
                    , patientCount: {
                        am: 5,
                        pm: 7
                    }
                }
            }
        }
    }
}
