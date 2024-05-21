import { NurseAssignments, Provider } from "../page";

export function autoAssigner(nurseList: string[], roomList: string[], providerList: Provider[], roomParents?: Record<string, string | null>): NurseAssignments {
    const nurseAssignments: NurseAssignments = {};
    /*
    * Begin by initializing the nurse assignments if there are already rooms assigned to nurses.
    * This is for use case when nurses are always assigned to rooms but providers are moved around.
    */
    if (roomParents) {
        for (const [room, nurse] of Object.entries(roomParents)) {
            if (nurse && !nurseAssignments[nurse]) nurseAssignments[nurse] = {};
            if (nurse && nurseAssignments[nurse]) {
                nurseAssignments[nurse] = {
                    ...nurseAssignments[nurse],
                    [room]: { am: null, pm: null }
                }
            }
        }
    }

    // Assign rooms equally to nurses
    // Assign providers to rooms for AM, skipping assignment if patientCount = 0 and keeping patientCount as even as possible
    // Assign providers to rooms for PM, skipping assignment if patientCount = 0, maintaining same room if already in a room for AM, and keeping patientCount as even as possible

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
