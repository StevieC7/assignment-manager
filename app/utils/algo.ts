import { Provider, ProviderRooms } from "../page";

export function providerMatcher(nurses: string[], providers: Provider[], rooms: string[], averageAssignments: number) {
    const assignments: Record<string, Provider[]> = {};

    const usedProviders: Provider[] = [];
    for (const nurse of nurses) {
        let runningPatientCount = 0;
        const nurseProviders: Provider[] = [];
        for (const provider of providers) {
            if (!usedProviders.find(usedProvider => usedProvider == provider) && runningPatientCount + provider.patientCount <= averageAssignments) {
                usedProviders.push(provider);
                runningPatientCount += provider.patientCount;
                nurseProviders.push(provider);
            }
        }
        assignments[nurse] = nurseProviders;
    }

    const roomAssignments: Record<string, ProviderRooms[]> = {};
    let roomPointer = 0;
    for (const nurse of nurses) {
        for (const provider of assignments[nurse]) {
            if (roomPointer < rooms.length) {
                if (!roomAssignments[nurse]) roomAssignments[nurse] = [];
                roomAssignments[nurse].push({ provider, room: rooms[roomPointer] });
                roomPointer++;
            }
        }
    }

    return { roomAssignments };
}
