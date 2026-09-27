import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FIELD_ERROR, FIELD_LABEL, INPUT } from "../formStyles";
import type { TTripDetailsSchema } from "../Modal/CreateTripModal/createTripZod";

interface TripDetailsFieldsProps {
  register: UseFormRegister<TTripDetailsSchema>;
  errors: FieldErrors<TTripDetailsSchema>;
}

/** Trip name, location and start/end dates, shared by the create and edit trip forms. */
export function TripDetailsFields({ register, errors }: TripDetailsFieldsProps) {
  return (
    <>
      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>Trip name</span>
        <input {...register("tripName")} placeholder='e.g. Siargao' className={INPUT} />
        {errors.tripName ? <span className={FIELD_ERROR}>{errors.tripName.message}</span> : null}
      </label>

      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>Location (optional)</span>
        <input {...register("location")} placeholder='e.g. General Luna, Siargao' className={INPUT} />
      </label>

      <div className='grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3'>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>Starts</span>
          <input type='date' {...register("startDate")} className={INPUT} />
          {errors.startDate ? <span className={FIELD_ERROR}>{errors.startDate.message}</span> : null}
        </label>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>Ends</span>
          <input type='date' {...register("endDate")} className={INPUT} />
          {errors.endDate ? <span className={FIELD_ERROR}>{errors.endDate.message}</span> : null}
        </label>
      </div>
    </>
  );
}
