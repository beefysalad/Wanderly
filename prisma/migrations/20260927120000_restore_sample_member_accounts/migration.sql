-- Data-only migration. The sample-data member accounts are placeholders that no Firebase
-- account should own. Before sync stopped linking accounts through unverified emails, a Firebase
-- sign-up with one of their emails could bind itself to the row. Put back the seed Firebase ids
-- (and the seed profile) so any such Firebase account no longer resolves to these rows.
UPDATE "User" AS u
SET "firebaseId" = seed.firebase_id,
    "name" = seed.name,
    "imageUrl" = seed.image_url,
    "bio" = NULL,
    "travelStyle" = NULL,
    "firebaseDisabled" = false,
    "updatedAt" = NOW()
FROM (VALUES
  ('eleven.dummy@example.com', 'dummy_eleven_seed', 'Eleven', 'https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/eleven_q1wfzp.jpg'),
  ('mike.dummy@example.com', 'dummy_mike_seed', 'Mike', 'https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/Mike_Stranger_Things_Image_ljf6ll.jpg'),
  ('steve.dummy@example.com', 'dummy_steve_seed', 'Steve', 'https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/Steve_Stranger_Things_Image_mnn35x.jpg')
) AS seed (email, firebase_id, name, image_url)
WHERE u."email" = seed.email
  AND u."firebaseId" <> seed.firebase_id;
