import EditTrip from "@/src/app/components/pages/EditTrip";

const EditTripPage = async ({ params }: { params: Promise<{ tripId: string; groupId: string }> }) => {
  const { tripId, groupId } = await params;
  return <EditTrip tripId={tripId} groupId={groupId} />;
};

export default EditTripPage;
