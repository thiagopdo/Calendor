import { clerkClient } from "@clerk/nextjs/server";
import { addMonths } from "date-fns/addMonths";
import { eachMinuteOfInterval } from "date-fns/eachMinuteOfInterval";
import { endOfDay } from "date-fns/endOfDay";
import { roundToNearestMinutes } from "date-fns/roundToNearestMinutes";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MeetingForm } from "@/components/forms/MeetingForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule";

/**
 * Renders the BookEventPage component.
 *
 * This component fetches event details and valid time slots for booking an event.
 * If no valid time slots are available, it renders the NoTimeSlots component.
 *
 * @param {Object} param0 - The component props.
 * @param {Object} param0.params - The route parameters.
 * @param {string} param0.params.clerkUserId - The ID of the Clerk user.
 * @param {string} param0.params.eventId - The ID of the event.
 * @returns {JSX.Element} - The rendered component.
 */

export const revalidate = 0;

export default async function BookEventPage(context: {
  params: { clerkUserId: string; eventId: string };
}) {
  const { clerkUserId, eventId } = await context.params;
  // Fetch event details from the database
  const event = await db.query.EventTable.findFirst({
    where: ({ clerkUserId: userIdCol, isActive, id }, { eq, and }) =>
      and(eq(isActive, true), eq(userIdCol, clerkUserId), eq(id, eventId)),
  });

  if (event == null) return notFound();

  const calendarUser = await (await clerkClient()).users.getUser(clerkUserId);
  const startDate = roundToNearestMinutes(new Date(), {
    nearestTo: 15,
    roundingMethod: "ceil",
  });
  const endDate = endOfDay(addMonths(startDate, 2));

  // Get valid times from schedule for the event
  const validTimes = await getValidTimesFromSchedule(
    eachMinuteOfInterval(
      { start: startDate, end: endDate },
      {
        step: 15,
      }
    ),
    event
  );

  // If no valid times are available, render the NoTimeSlots component
  if (validTimes.length === 0) {
    return <NoTimeSlots event={event} calendarUser={calendarUser} />;
  }
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {calendarUser.fullName}{" "}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <MeetingForm
          validTimes={validTimes}
          eventId={event.id}
          clerkUserId={clerkUserId}
        />
      </CardContent>
    </Card>
  );
}

//* Renders the NoTimeSlots component.
function NoTimeSlots({
  event,
  calendarUser,
}: {
  event: {
    name: string;
    description: string | null;
  };
  calendarUser: {
    id: string;
    fullName: string | null;
  };
}) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {calendarUser.fullName}{" "}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {calendarUser.fullName} is currently booked out. Please check back
        later.
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href={`/book/${calendarUser.id}`}>Choose another event</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
