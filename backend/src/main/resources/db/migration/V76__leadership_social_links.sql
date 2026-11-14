-- Social profile links shown as round icons around each leadership photo on the landing page.
-- All optional: an icon is only shown for a link that has been filled in.
ALTER TABLE leadership_profile
    ADD COLUMN linkedin_url  VARCHAR(300) NULL,
    ADD COLUMN facebook_url  VARCHAR(300) NULL,
    ADD COLUMN instagram_url VARCHAR(300) NULL,
    ADD COLUMN threads_url   VARCHAR(300) NULL;
