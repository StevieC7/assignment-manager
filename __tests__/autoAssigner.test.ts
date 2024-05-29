import { describe, expect, test } from '@jest/globals';
import { autoAssigner } from '@/app/utils/autoAssigner';
import { Provider } from '@/app/types/types';

describe('autoAssigner util', () => {
    test('does not alter existing room parents when given them', () => {
        const nurseList = ['Lisa', 'Rhonda', 'Jim'];
        const roomList = ['Room A', 'Room B', 'Room C'];
        const providerList: Provider[] = [{
            name: 'Dr. Smith',
            patientCount: {
                am: {
                    inPerson: 2,
                    virtual: 0
                },
                pm: {
                    inPerson: 2,
                    virtual: 0
                }
            }
        },
        {
            name: 'Dr. Patel',
            patientCount: {
                am: {
                    inPerson: 3,
                    virtual: 0
                },
                pm: {
                    inPerson: 4,
                    virtual: 0
                }
            }
        }];
        const existingRoomParents = {};
        const result = autoAssigner(nurseList, roomList, providerList, existingRoomParents);
        const { roomParents } = result;
        expect(roomParents).toEqual(existingRoomParents);
    });
});
