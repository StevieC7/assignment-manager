import { Provider } from "../page";

export function roomMatcher(nurses: string[], providers: Provider[], averageAssignments: number) {
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

    return { assignments };
}
