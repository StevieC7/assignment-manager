import { useDroppable, DragOverlayProps } from "@dnd-kit/core"
type Props = {
    nurseId: string
    children: DragOverlayProps['children']
}
export default function RoomZone({ nurseId, children }: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id: nurseId
    })
    return (
        <div ref={setNodeRef} className={`${isOver ? 'bg-red-50' : 'bg-inherit'} border-2 w-96 ml-6 h-96`}>
            {children}
        </div>
    )
}
