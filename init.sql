-- STEP 1: Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 2: Define ENUM Types
CREATE TYPE "UserStatus"       AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE "Gender"           AS ENUM ('male','female','non_binary','other','prefer_not_to_say');
CREATE TYPE "NotificationType" AS ENUM (
    'comment_reply','post_reply','mention','message','moderator_invite',
    'system_message','report_update'
);
CREATE TYPE "MediaType"        AS ENUM ('image','video','audio');
CREATE TYPE "PrincipalRole"    AS ENUM ('user','admin');
CREATE TYPE "VoteType"         AS ENUM ('upvote', 'downvote');
CREATE TYPE "MessageType" AS ENUM (
    'direct',
    'system',
    'moderator_communication',
    'admin_communication'
);

-- STEP 3: Define Tables
CREATE TABLE "Account" (
    "accountId"  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username"   VARCHAR(50)  NOT NULL UNIQUE,
    "password"   VARCHAR(255) NOT NULL,
    "email"      VARCHAR(100) NOT NULL UNIQUE,
    "created"    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Profile" (
    "profileId"  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "avatar"     UUID,
    "banner"     UUID,
    "bio"        VARCHAR(500),
    "location"   VARCHAR(100),
    "displayName" VARCHAR(100),
    "gender"     "Gender"
);

CREATE TABLE "Principal" (
    "principalId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "accountId"  UUID NOT NULL UNIQUE REFERENCES "Account"("accountId") ON DELETE CASCADE,
    "profileId"  UUID NOT NULL UNIQUE REFERENCES "Profile"("profileId") ON DELETE CASCADE,
    "role"       "PrincipalRole" NOT NULL
);

CREATE TABLE "RegisteredUser" (
    "userId"      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "principalId" UUID NOT NULL UNIQUE REFERENCES "Principal"("principalId") ON DELETE CASCADE,
    "karma"       INTEGER  DEFAULT 0,
    "isVerified" BOOLEAN  DEFAULT FALSE,
    "status"      "UserStatus" DEFAULT 'active',
    "lastActive" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Admin" (
    "adminId"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "principalId"     UUID NOT NULL UNIQUE REFERENCES "Principal"("principalId") ON DELETE CASCADE,
    "grantedAt"       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Media" (
    "mediaId"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "uploaderUserId"      UUID REFERENCES "RegisteredUser"("userId") ON DELETE SET NULL,
    "url"                 VARCHAR(255) UNIQUE NOT NULL,
    "mediaType"           "MediaType" NOT NULL,
    "mimeType"            VARCHAR(50),
    "fileSize"            BIGINT,
    "createdAt"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Profile"
ADD CONSTRAINT "fk_profile_avatar" FOREIGN KEY ("avatar") REFERENCES "Media"("mediaId") ON DELETE SET NULL,
ADD CONSTRAINT "fk_profile_banner" FOREIGN KEY ("banner") REFERENCES "Media"("mediaId") ON DELETE SET NULL;

CREATE TABLE "Subtable" (
    "subtableId"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name"               VARCHAR(50) UNIQUE NOT NULL,
    "description"        TEXT,
    "createdAt"          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorUserId"      UUID REFERENCES "RegisteredUser"("userId") ON DELETE SET NULL,
    "icon"               UUID REFERENCES "Media"("mediaId") ON DELETE SET NULL,
    "banner"             UUID REFERENCES "Media"("mediaId") ON DELETE SET NULL,
    "memberCount"        INT DEFAULT 1 NOT NULL
);

CREATE TABLE "Subscription" (
    "subscriptionId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"         UUID NOT NULL REFERENCES "RegisteredUser"("userId") ON DELETE CASCADE,
    "subtableId"     UUID NOT NULL REFERENCES "Subtable"("subtableId") ON DELETE CASCADE,
    "subscribedAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "subtableId")
);

CREATE TABLE "Moderators" (
    "userId"           UUID NOT NULL REFERENCES "RegisteredUser"("userId") ON DELETE CASCADE,
    "subtableId"       UUID NOT NULL REFERENCES "Subtable"("subtableId")    ON DELETE CASCADE,
    "assignedAt"       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId","subtableId")
);

CREATE TABLE "Post" (
    "postId"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subtableId"       UUID NOT NULL REFERENCES "Subtable"("subtableId") ON DELETE CASCADE,
    "authorUserId"     UUID REFERENCES "RegisteredUser"("userId") ON DELETE SET NULL,
    "title"            VARCHAR(300) NOT NULL,
    "body"             TEXT NULL,
    "createdAt"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voteCount"        INT DEFAULT 0 NOT NULL,
    "commentCount"     INT DEFAULT 0 NOT NULL,
    "isLocked"         BOOLEAN DEFAULT FALSE NOT NULL,
    "isRemoved"        BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE "Comment" (
    "commentId"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "postId"           UUID NOT NULL REFERENCES "Post"("postId") ON DELETE CASCADE,
    "authorUserId"     UUID REFERENCES "RegisteredUser"("userId") ON DELETE SET NULL,
    "parentCommentId"  UUID REFERENCES "Comment"("commentId") ON DELETE CASCADE,
    "body"             TEXT NULL,
    "createdAt"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voteCount"        INT DEFAULT 0 NOT NULL,
    "isRemoved"        BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE "Vote" (
    "voteId"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "voterUserId"      UUID NOT NULL REFERENCES "RegisteredUser"("userId") ON DELETE CASCADE,
    "postId"           UUID REFERENCES "Post"("postId") ON DELETE CASCADE,
    "commentId"        UUID REFERENCES "Comment"("commentId") ON DELETE CASCADE,
    "voteType"         "VoteType" NOT NULL,
    "createdAt"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_vote_target" CHECK (
        ("postId" IS NOT NULL AND "commentId" IS NULL) OR
        ("postId" IS NULL AND "commentId" IS NOT NULL)
    )
);

CREATE TABLE "Report" (
    "reportId"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reporterPrincipalId" UUID NOT NULL REFERENCES "Principal"("principalId") ON DELETE CASCADE,
    "postId"              UUID REFERENCES "Post"("postId")        ON DELETE CASCADE,
    "commentId"           UUID REFERENCES "Comment"("commentId") ON DELETE CASCADE,
    "reason"              TEXT NOT NULL,
    "createdAt"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHandled"           BOOLEAN DEFAULT FALSE NOT NULL,
    "handlerPrincipalId"  UUID REFERENCES "Principal"("principalId") ON DELETE SET NULL,
    "handledAt"           TIMESTAMP,
    CONSTRAINT "chk_report_target" CHECK (
        ("postId" IS NOT NULL AND "commentId" IS NULL) OR
        ("postId" IS NULL AND "commentId" IS NOT NULL)
    )
);

CREATE TABLE "SystemRule" (
    "ruleId"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title"              VARCHAR(255) NOT NULL,
    "description"        TEXT NOT NULL,
    "createdAt"          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminId" UUID REFERENCES "Admin"("adminId") ON DELETE SET NULL
);

CREATE TABLE "SubtableRule" (
    "ruleId"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subtableId"         UUID NOT NULL REFERENCES "Subtable"("subtableId") ON DELETE CASCADE,
    "title"              VARCHAR(255) NOT NULL,
    "description"        TEXT NOT NULL,
    "createdAt"          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorPrincipalId" UUID REFERENCES "Principal"("principalId") ON DELETE SET NULL
);

CREATE TABLE "Notification" (
    "notificationId"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "recipientUserId"       UUID NOT NULL REFERENCES "RegisteredUser"("userId") ON DELETE CASCADE,
    "triggeringPrincipalId" UUID REFERENCES "Principal"("principalId") ON DELETE SET NULL,
    "type"                  "NotificationType" NOT NULL,
    "sourceUrl"             VARCHAR(2048),
    "content"               TEXT,
    "isRead"                BOOLEAN DEFAULT FALSE NOT NULL,
    "createdAt"             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Message" (
    "messageId"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "parentMessageId"     UUID REFERENCES "Message"("messageId") ON DELETE SET NULL,
    "senderPrincipalId"   UUID REFERENCES "Principal"("principalId") ON DELETE SET NULL,
    "recipientPrincipalId" UUID REFERENCES "Principal"("principalId") ON DELETE SET NULL,
    "body"                TEXT NOT NULL,
    "messageType"         "MessageType" NOT NULL DEFAULT 'direct',
    "createdAt"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead"              BOOLEAN DEFAULT FALSE NOT NULL,
    "senderDeleted"       BOOLEAN DEFAULT FALSE NOT NULL,
    "recipientDeleted"    BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE "Ban" (
    "banId"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bannedAccountId"     UUID NOT NULL REFERENCES "Account"("accountId") ON DELETE CASCADE,
    "issuerPrincipalId"   UUID REFERENCES "Principal"("principalId") ON DELETE SET NULL,
    "subtableId"          UUID REFERENCES "Subtable"("subtableId") ON DELETE CASCADE,
    "reason"              TEXT,
    "expiresAt"           TIMESTAMP,
    "createdAt"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ModeratorLog" (
    "logId"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "moderatorUserId"     UUID REFERENCES "RegisteredUser"("userId") ON DELETE SET NULL,
    "subtableId"          UUID NOT NULL REFERENCES "Subtable"("subtableId") ON DELETE CASCADE,
    "details"             TEXT,
    "createdAt"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AdminLog" (
    "logId"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "adminId"             UUID REFERENCES "Admin"("adminId") ON DELETE SET NULL,
    "details"             TEXT,
    "createdAt"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- STEP 4: Functions for Triggers
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Post" SET "commentCount" = "commentCount" + 1 WHERE "postId" = NEW."postId";
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD."postId" IS NOT NULL THEN
             UPDATE "Post" SET "commentCount" = GREATEST(0,"commentCount" - 1) WHERE "postId" = OLD."postId";
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_vote_count()
RETURNS TRIGGER AS $$
DECLARE
    diff INT := 0;
    tgt_post UUID;
    tgt_comment UUID;
    author_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        tgt_post := NEW."postId";
        tgt_comment := NEW."commentId";
        IF NEW."voteType" = 'upvote' THEN diff := 1; ELSE diff := -1; END IF;
    ELSIF TG_OP = 'DELETE' THEN
        tgt_post := OLD."postId";
        tgt_comment := OLD."commentId";
        IF OLD."voteType" = 'upvote' THEN diff := -1; ELSE diff := 1; END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD."voteType" <> NEW."voteType" THEN
            tgt_post := NEW."postId";
            tgt_comment := NEW."commentId";
             IF NEW."voteType" = 'upvote' THEN diff := 2; ELSE diff := -2; END IF;
        ELSE
             RETURN NULL;
        END IF;
    ELSE
         RETURN NULL;
    END IF;

    IF tgt_post IS NOT NULL THEN
        UPDATE "Post" SET "voteCount" = "voteCount" + diff WHERE "postId" = tgt_post;
        SELECT "authorUserId" INTO author_id FROM "Post" WHERE "postId" = tgt_post;
        IF author_id IS NOT NULL THEN
            UPDATE "RegisteredUser" SET "karma" = "karma" + diff WHERE "userId" = author_id;
        END IF;
    ELSIF tgt_comment IS NOT NULL THEN
        UPDATE "Comment" SET "voteCount" = "voteCount" + diff WHERE "commentId" = tgt_comment;
        SELECT "authorUserId" INTO author_id FROM "Comment" WHERE "commentId" = tgt_comment;
         IF author_id IS NOT NULL THEN
            UPDATE "RegisteredUser" SET "karma" = "karma" + diff WHERE "userId" = author_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_principal_single_role()
RETURNS TRIGGER AS $$
DECLARE
    principal_target_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'registereduser' THEN
        principal_target_id := NEW."principalId";
        IF EXISTS (SELECT 1 FROM "Admin" WHERE "principalId" = principal_target_id) THEN
            RAISE EXCEPTION 'Principal % cannot be added as RegisteredUser because they are already an Admin.', principal_target_id
                USING ERRCODE='integrity_constraint_violation', HINT='A principal must have only one role (User or Admin).';
        END IF;
    ELSIF TG_TABLE_NAME = 'admin' THEN
        principal_target_id := NEW."principalId";
        IF EXISTS (SELECT 1 FROM "RegisteredUser" WHERE "principalId" = principal_target_id) THEN
            RAISE EXCEPTION 'Principal % cannot be added as Admin because they are already a RegisteredUser.', principal_target_id
                 USING ERRCODE='integrity_constraint_violation', HINT='A principal must have only one role (User or Admin).';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_subtable_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Subtable" SET "memberCount" = "memberCount" + 1 WHERE "subtableId" = NEW."subtableId";
    ELSIF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM "Subtable" WHERE "subtableId" = OLD."subtableId") THEN
            UPDATE "Subtable" SET "memberCount" = GREATEST(0, "memberCount" - 1) WHERE "subtableId" = OLD."subtableId";
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- STEP 5: Assign Triggers
CREATE TRIGGER "set_account_timestamp"  BEFORE UPDATE ON "Account" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER "set_post_timestamp"     BEFORE UPDATE ON "Post"    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER "set_comment_timestamp"  BEFORE UPDATE ON "Comment" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER "update_post_comment_count_ins" AFTER INSERT ON "Comment" FOR EACH ROW EXECUTE FUNCTION trigger_update_comment_count();
CREATE TRIGGER "update_post_comment_count_del" AFTER DELETE ON "Comment" FOR EACH ROW EXECUTE FUNCTION trigger_update_comment_count();
CREATE TRIGGER "update_vote_count_ins"  AFTER INSERT ON "Vote" FOR EACH ROW EXECUTE FUNCTION trigger_update_vote_count();
CREATE TRIGGER "update_vote_count_del"  AFTER DELETE ON "Vote" FOR EACH ROW EXECUTE FUNCTION trigger_update_vote_count();
CREATE TRIGGER "update_vote_count_upd"  AFTER UPDATE ON "Vote" FOR EACH ROW EXECUTE FUNCTION trigger_update_vote_count();
CREATE TRIGGER "enforce_single_role_user"  BEFORE INSERT ON "RegisteredUser" FOR EACH ROW EXECUTE FUNCTION enforce_principal_single_role();
CREATE TRIGGER "enforce_single_role_admin" BEFORE INSERT ON "Admin" FOR EACH ROW EXECUTE FUNCTION enforce_principal_single_role();
CREATE TRIGGER "update_subtable_member_count_ins" AFTER INSERT ON "Subscription" FOR EACH ROW EXECUTE FUNCTION trigger_update_subtable_member_count();
CREATE TRIGGER "update_subtable_member_count_del" AFTER DELETE ON "Subscription" FOR EACH ROW EXECUTE FUNCTION trigger_update_subtable_member_count();


-- STEP 6: Create Indexes
CREATE INDEX idx_account_username ON "Account"("username");
CREATE INDEX idx_account_email ON "Account"("email");
CREATE INDEX idx_principal_accountid ON "Principal"("accountId");
CREATE INDEX idx_principal_profileid ON "Principal"("profileId");
CREATE INDEX idx_registereduser_principalid ON "RegisteredUser"("principalId");
CREATE INDEX idx_admin_principalid ON "Admin"("principalId");
CREATE INDEX idx_subtable_name ON "Subtable"("name");
CREATE INDEX idx_subtable_creatoruserid ON "Subtable"("creatorUserId");
CREATE INDEX idx_subscription_userid ON "Subscription"("userId");
CREATE INDEX idx_subscription_subtableid ON "Subscription"("subtableId");
CREATE INDEX idx_moderators_subtableid ON "Moderators"("subtableId");
CREATE INDEX idx_post_subtableid ON "Post"("subtableId");
CREATE INDEX idx_post_authoruserid ON "Post"("authorUserId");
CREATE INDEX idx_post_createdat ON "Post"("createdAt");
CREATE INDEX idx_comment_postid ON "Comment"("postId");
CREATE INDEX idx_comment_authoruserid ON "Comment"("authorUserId");
CREATE INDEX idx_comment_parentcommentid ON "Comment"("parentCommentId");
CREATE INDEX idx_vote_voteruserid ON "Vote"("voterUserId");
CREATE INDEX idx_vote_postid ON "Vote"("postId");
CREATE INDEX idx_vote_commentid ON "Vote"("commentId");
CREATE INDEX idx_vote_votetype ON "Vote"("voteType");
CREATE INDEX idx_report_reporterprincipalid ON "Report"("reporterPrincipalId");
CREATE INDEX idx_report_postid ON "Report"("postId");
CREATE INDEX idx_report_commentid ON "Report"("commentId");
CREATE INDEX idx_report_handlerprincipalid ON "Report"("handlerPrincipalId");
CREATE INDEX idx_systemrule_createdbyadminid ON "SystemRule"("createdByAdminId");
CREATE INDEX idx_subtablerule_subtableid ON "SubtableRule"("subtableId");
CREATE INDEX idx_notification_recipientuserid ON "Notification"("recipientUserId");
CREATE INDEX idx_notification_triggeringprincipalid ON "Notification"("triggeringPrincipalId");
CREATE INDEX idx_message_senderprincipalid ON "Message"("senderPrincipalId");
CREATE INDEX idx_message_recipientprincipalid ON "Message"("recipientPrincipalId");
CREATE INDEX idx_message_parentmessageid ON "Message"("parentMessageId");
CREATE INDEX idx_message_messagetype ON "Message"("messageType");
CREATE INDEX idx_ban_bannedaccountid ON "Ban"("bannedAccountId");
CREATE INDEX idx_ban_subtableid ON "Ban"("subtableId");
CREATE INDEX idx_moderatorlog_subtableid ON "ModeratorLog"("subtableId");
CREATE INDEX idx_moderatorlog_moderatoruserid ON "ModeratorLog"("moderatorUserId");
CREATE INDEX idx_adminlog_adminid ON "AdminLog"("adminId");
CREATE INDEX idx_media_uploaderuserid ON "Media"("uploaderUserId");
CREATE INDEX idx_post_title_trgm ON "Post" USING gin (to_tsvector('english', "title"));
CREATE INDEX idx_post_body_trgm ON "Post" USING gin (to_tsvector('english', "body"));


-- STEP 7: Create Views
CREATE OR REPLACE VIEW "UserProfile" AS
SELECT
    ru."userId",
    p."principalId",
    a."username",
    pr."displayName",
    avatar_media.url AS "avatar",
    banner_media.url AS "banner",
    pr."bio",
    pr."location",
    pr."gender",
    ru."karma",
    ru."isVerified",
    ru."status",
    a."created" AS "accountCreated",
    ru."lastActive"
FROM "RegisteredUser" ru
JOIN "Principal"       p  ON p."principalId" = ru."principalId"
JOIN "Account"         a  ON a."accountId"   = p."accountId"
JOIN "Profile"         pr ON pr."profileId"  = p."profileId"
LEFT JOIN "Media" avatar_media ON pr."avatar" = avatar_media."mediaId"
LEFT JOIN "Media" banner_media ON pr."banner" = banner_media."mediaId";

CREATE OR REPLACE VIEW "UserCommentDetails" AS
SELECT
    c."commentId",
    c."postId",
    c."parentCommentId",
    c."body",
    c."createdAt" AS "commentCreatedAt",
    c."updatedAt" AS "commentUpdatedAt",
    c."voteCount",
    c."isRemoved",
    up."userId" AS "authorUserId",
    up."principalId" AS "authorPrincipalId",
    up."username" AS "authorUsername",
    up."displayName" AS "authorDisplayName",
    up."avatar" AS "authorAvatar",
    up."karma" AS "authorKarma",
    up."isVerified" AS "authorIsVerified",
    up."status" AS "authorStatus",
    up."accountCreated" AS "authorAccountCreated"
FROM "Comment" c
LEFT JOIN "UserProfile" up ON c."authorUserId" = up."userId";

CREATE OR REPLACE VIEW "UserPostDetails" AS
SELECT
    p."postId",
    p."subtableId",
    p."title",
    p."body",
    p."createdAt"        AS "postCreatedAt",
    p."updatedAt"        AS "postUpdatedAt",
    p."voteCount",
    p."commentCount",
    p."isLocked",
    p."isRemoved",
    up."userId"          AS "authorUserId",
    up."principalId"     AS "authorPrincipalId",
    up."username"        AS "authorUsername",
    up."displayName"     AS "authorDisplayName",
    up."avatar"          AS "authorAvatar",
    up."karma"           AS "authorKarma",
    up."isVerified"      AS "authorIsVerified",
    up."status"          AS "authorStatus",
    up."accountCreated"  AS "authorAccountCreated",
    s."name"             AS "subtableName",
    s."description"      AS "subtableDescription",
    sub_icon_media.url   AS "subtableIcon",
    sub_banner_media.url AS "subtableBanner",
    s."memberCount"      AS "subtableMemberCount",
    s."createdAt"        AS "subtableCreatedAt",
    s."creatorUserId"    AS "subtableCreatorUserId"
FROM "Post" p
LEFT JOIN "UserProfile" up ON p."authorUserId" = up."userId"
LEFT JOIN "Subtable"    s  ON p."subtableId" = s."subtableId"
LEFT JOIN "Media" sub_icon_media ON s."icon" = sub_icon_media."mediaId"
LEFT JOIN "Media" sub_banner_media ON s."banner" = sub_banner_media."mediaId";

CREATE OR REPLACE VIEW "UserVoteDetails" AS
SELECT
    v."voteId",
    v."postId",
    v."commentId",
    v."voteType",
    v."createdAt" AS "voteCreatedAt",
    up."userId" AS "voterUserId",
    up."principalId" AS "voterPrincipalId",
    up."username" AS "voterUsername",
    up."displayName" AS "voterDisplayName",
    up."avatar" AS "voterAvatar",
    up."karma" AS "voterKarma",
    up."isVerified" AS "voterIsVerified",
    up."status" AS "voterStatus",
    up."accountCreated" AS "voterAccountCreated"
FROM "Vote" v
LEFT JOIN "UserProfile" up ON v."voterUserId" = up."userId";

CREATE OR REPLACE VIEW "UserMessageDetails" AS
SELECT
    m."messageId",
    m."parentMessageId",
    m."body",
    m."messageType",
    m."createdAt" AS "messageCreatedAt",
    m."isRead",
    m."senderDeleted",
    m."recipientDeleted",

    m."senderPrincipalId",
    sender_p_acc."username" AS "senderUsername",
    sender_p_profile."displayName" AS "senderDisplayName",
    sender_avatar_media.url AS "senderAvatar",
    sender_up."userId" AS "senderUserId",
    sender_up."karma" AS "senderKarma",
    sender_up."isVerified" AS "senderIsVerified",
    sender_up."status" AS "senderStatus",
    sender_p_acc."created" AS "senderAccountCreated",

    m."recipientPrincipalId",
    recipient_p_acc."username" AS "recipientUsername",
    recipient_p_profile."displayName" AS "recipientDisplayName",
    recipient_avatar_media.url AS "recipientAvatar",
    recipient_up."userId" AS "recipientUserId",
    recipient_up."karma" AS "recipientKarma",
    recipient_up."isVerified" AS "recipientIsVerified",
    recipient_up."status" AS "recipientStatus",
    recipient_p_acc."created" AS "recipientAccountCreated"

FROM "Message" m
LEFT JOIN "Principal" sender_p ON m."senderPrincipalId" = sender_p."principalId"
LEFT JOIN "Account" sender_p_acc ON sender_p."accountId" = sender_p_acc."accountId"
LEFT JOIN "Profile" sender_p_profile ON sender_p."profileId" = sender_p_profile."profileId"
LEFT JOIN "Media" sender_avatar_media ON sender_p_profile."avatar" = sender_avatar_media."mediaId"
LEFT JOIN "UserProfile" sender_up ON m."senderPrincipalId" = sender_up."principalId"
LEFT JOIN "Principal" recipient_p ON m."recipientPrincipalId" = recipient_p."principalId"
LEFT JOIN "Account" recipient_p_acc ON recipient_p."accountId" = recipient_p_acc."accountId"
LEFT JOIN "Profile" recipient_p_profile ON recipient_p."profileId" = recipient_p_profile."profileId"
LEFT JOIN "Media" recipient_avatar_media ON recipient_p_profile."avatar" = recipient_avatar_media."mediaId"
LEFT JOIN "UserProfile" recipient_up ON m."recipientPrincipalId" = recipient_up."principalId";


-- STEP 8: Insert Sample Data
-- Insert Accounts
INSERT INTO "Account" ("accountId","username","password","email") VALUES
  ('00000000-0000-0000-0000-000000000001','user1','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','user1@example.com'),
  ('00000000-0000-0000-0000-000000000002','user2','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','user2@example.com'),
  ('00000000-0000-0000-0000-000000000003','user3','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','user3@example.com'),
  ('00000000-0000-0000-0000-000000000004','user4','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','user4@example.com'),
  ('00000000-0000-0000-0000-000000000005','user5','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','user5@example.com'),
  ('00000000-0000-0000-0000-000000000006','admin1','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','admin1@example.com'),
  ('00000000-0000-0000-0000-000000000007','admin2','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','admin2@example.com'),
  ('00000000-0000-0000-0000-000000000008','admin3','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','admin3@example.com'),
  ('00000000-0000-0000-0000-000000000009','admin4','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','admin4@example.com'),
  ('00000000-0000-0000-0000-000000000010','admin5','$argon2id$v=19$m=65536,t=4,p=2$4xixMi0tUPYwONkSbOexvg$0LkDJEIyNpo2DPKOXPtinfSL04J4jhxNxs6Vsd4GM+I','admin5@example.com')
ON CONFLICT DO NOTHING;

-- Insert Profiles
INSERT INTO "Profile" ("profileId","avatar","banner","bio","location","displayName","gender") VALUES
  ('00000000-0000-0000-0000-000000000011',NULL,NULL,'Hi, I am user1!','City1','User One','male'),
  ('00000000-0000-0000-0000-000000000012',NULL,NULL,'Passionate coder.','City2','User Two','female'),
  ('00000000-0000-0000-0000-000000000013',NULL,NULL,'Coffee addict.','City3','User Three','non_binary'),
  ('00000000-0000-0000-0000-000000000014',NULL,NULL,'Love open source.','City4','User Four','other'),
  ('00000000-0000-0000-0000-000000000015',NULL,NULL,'Tech enthusiast.','City5','User Five','prefer_not_to_say'),
  ('00000000-0000-0000-0000-000000000016',NULL,NULL,'I handle reports.','City1','Admin One','female'),
  ('00000000-0000-0000-0000-000000000017',NULL,NULL,'System steward.','City2','Admin Two','male'),
  ('00000000-0000-0000-0000-000000000018',NULL,NULL,'Core maintainer.','City3','Admin Three','non_binary'),
  ('00000000-0000-0000-0000-000000000019',NULL,NULL,'Moderator lead.','City4','Admin Four','other'),
  ('00000000-0000-0000-0000-000000000020',NULL,NULL,'I manage the community.','City5','Admin Five','prefer_not_to_say')
ON CONFLICT DO NOTHING;

-- Insert Principals
INSERT INTO "Principal" ("principalId","accountId","profileId","role") VALUES
  ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','user'),
  ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012','user'),
  ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000013','user'),
  ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000014','user'),
  ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000015','user'),
  ('00000000-0000-0000-0000-000000000026','00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000016','admin'),
  ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000017','admin'),
  ('00000000-0000-0000-0000-000000000028','00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000018','admin'),
  ('00000000-0000-0000-0000-000000000029','00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000019','admin'),
  ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000020','admin')
ON CONFLICT DO NOTHING;

-- Insert Registered Users
INSERT INTO "RegisteredUser" ("userId","principalId","karma","isVerified","status","lastActive") VALUES
  ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000021',   0, TRUE,  'active',    CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000022',   0, FALSE, 'suspended', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000023',   0, TRUE,  'active',    CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000024',   0, FALSE, 'banned',    CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000025',   0, TRUE,  'active',    CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert Admins
INSERT INTO "Admin" ("adminId","principalId","grantedAt") VALUES
  ('00000000-0000-0000-0000-000000000036','00000000-0000-0000-0000-000000000026','2025-04-01 10:00:00'),
  ('00000000-0000-0000-0000-000000000037','00000000-0000-0000-0000-000000000027','2025-03-15 14:20:00'),
  ('00000000-0000-0000-0000-000000000038','00000000-0000-0000-0000-000000000028','2025-02-28 08:00:00'),
  ('00000000-0000-0000-0000-000000000039','00000000-0000-0000-0000-000000000029','2025-04-18 16:45:00'),
  ('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000030','2025-04-20 10:30:00')
ON CONFLICT DO NOTHING;

-- Insert Media
INSERT INTO "Media" ("mediaId","uploaderUserId","url","mediaType","mimeType","fileSize") VALUES
  ('00000000-0000-0000-0000-000000000151','00000000-0000-0000-0000-000000000031','https://cdn.example.com/media/1.jpg','image','image/jpeg',204800),
  ('00000000-0000-0000-0000-000000000152','00000000-0000-0000-0000-000000000032','https://cdn.example.com/media/2.png','image','image/png',102400),
  ('00000000-0000-0000-0000-000000000153','00000000-0000-0000-0000-000000000033','https://cdn.example.com/media/3.mp4','video','video/mp4',10485760),
  ('00000000-0000-0000-0000-000000000154','00000000-0000-0000-0000-000000000034','https://cdn.example.com/media/4.mov','video','video/quicktime',20971520),
  ('00000000-0000-0000-0000-000000000155','00000000-0000-0000-0000-000000000035','https://cdn.example.com/media/5.gif','image','image/gif',51200)
ON CONFLICT DO NOTHING;

-- Insert Subtables
INSERT INTO "Subtable" ("subtableId","name","description","creatorUserId","icon","banner","memberCount") VALUES
  ('00000000-0000-0000-0000-000000000041','AskAnything','A place for any question','00000000-0000-0000-0000-000000000031',NULL,NULL,1),
  ('00000000-0000-0000-0000-000000000042','TechTalk','Discussions about technology','00000000-0000-0000-0000-000000000032',NULL,NULL,1),
  ('00000000-0000-0000-0000-000000000043','NewsHub','Share and discuss news','00000000-0000-0000-0000-000000000033',NULL,NULL,1),
  ('00000000-0000-0000-0000-000000000044','AnimeClub','For anime fans','00000000-0000-0000-0000-000000000034',NULL,NULL,1),
  ('00000000-0000-0000-0000-000000000045','Foodies','Food recipes and reviews','00000000-0000-0000-0000-000000000035',NULL,NULL,1)
ON CONFLICT DO NOTHING;

-- Insert Subscriptions
INSERT INTO "Subscription" ("userId", "subtableId") VALUES
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000042'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000041'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000045'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000041'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000041'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000042'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000043'),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000044'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000045')
ON CONFLICT ("userId", "subtableId") DO NOTHING;

-- Insert Moderators
INSERT INTO "Moderators" ("userId","subtableId") VALUES
  ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000041'),
  ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000042'),
  ('00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000043'),
  ('00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000044'),
  ('00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000045')
ON CONFLICT DO NOTHING;

-- Insert Posts
INSERT INTO "Post" ("postId","subtableId","authorUserId","title","body", "voteCount", "commentCount") VALUES
  ('00000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000031','Welcome to AskAnything','Feel free to ask any questions here.', 0, 0),
  ('00000000-0000-0000-0000-000000000052','00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000032','Question about SQL','How do I write a JOIN query?', 0, 0),
  ('00000000-0000-0000-0000-000000000053','00000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000033','Latest tech trends','Let’s talk about AI advancements.', 0, 0),
  ('00000000-0000-0000-0000-000000000054','00000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000034','JavaScript vs TypeScript','Which one is better?', 0, 0),
  ('00000000-0000-0000-0000-000000000055','00000000-0000-0000-0000-000000000043','00000000-0000-0000-0000-000000000035','Breaking news','Major event happened today.', 0, 0),
  ('00000000-0000-0000-0000-000000000056','00000000-0000-0000-0000-000000000043','00000000-0000-0000-0000-000000000031','News sources','Where do you get your news?', 0, 0),
  ('00000000-0000-0000-0000-000000000057','00000000-0000-0000-0000-000000000044','00000000-0000-0000-0000-000000000032','Favorite anime','What’s your favorite series?', 0, 0),
  ('00000000-0000-0000-0000-000000000058','00000000-0000-0000-0000-000000000044','00000000-0000-0000-0000-000000000033','Anime recommendations','Suggest some good anime.', 0, 0),
  ('00000000-0000-0000-0000-000000000059','00000000-0000-0000-0000-000000000045','00000000-0000-0000-0000-000000000034','Best recipes','Share your recipe tips.', 0, 0),
  ('00000000-0000-0000-0000-000000000060','00000000-0000-0000-0000-000000000045','00000000-0000-0000-0000-000000000035','Food photography','How to take food photos?', 0, 0),
  ('00000000-0000-0000-0000-000000000251','00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000031','Post with NULL body', NULL, 0, 0)
ON CONFLICT DO NOTHING;

-- Insert Comments
INSERT INTO "Comment" ("commentId","postId","authorUserId","parentCommentId","body", "voteCount") VALUES
  ('00000000-0000-0000-0000-000000000061','00000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000032',NULL,'Thanks for the welcome!', 0),
  ('00000000-0000-0000-0000-000000000062','00000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000033',NULL,'Glad to be here.', 0),
  ('00000000-0000-0000-0000-000000000063','00000000-0000-0000-0000-000000000052','00000000-0000-0000-0000-000000000031',NULL,'Use INNER JOIN for matching rows.', 0),
  ('00000000-0000-0000-0000-000000000064','00000000-0000-0000-0000-000000000052','00000000-0000-0000-0000-000000000034',NULL,'LEFT JOIN might help if some values are missing.', 0),
  ('00000000-0000-0000-0000-000000000065','00000000-0000-0000-0000-000000000053','00000000-0000-0000-0000-000000000035',NULL,'AI is amazing!', 0),
  ('00000000-0000-0000-0000-000000000066','00000000-0000-0000-0000-000000000054','00000000-0000-0000-0000-000000000031',NULL,'TS gives you static types.', 0),
  ('00000000-0000-0000-0000-000000000067','00000000-0000-0000-0000-000000000054','00000000-0000-0000-0000-000000000035',NULL,'JS is more flexible though.', 0),
  ('00000000-0000-0000-0000-000000000068','00000000-0000-0000-0000-000000000055','00000000-0000-0000-0000-000000000032',NULL,'What happened?', 0),
  ('00000000-0000-0000-0000-000000000069','00000000-0000-0000-0000-000000000056','00000000-0000-0000-0000-000000000033',NULL,'I read BBC daily.', 0),
  ('00000000-0000-0000-0000-000000000070','00000000-0000-0000-0000-000000000057','00000000-0000-0000-0000-000000000034',NULL,'My favorite is Naruto.', 0),
  ('00000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000058','00000000-0000-0000-0000-000000000031',NULL,'Try Attack on Titan.', 0),
  ('00000000-0000-0000-0000-000000000072','00000000-0000-0000-0000-000000000059','00000000-0000-0000-0000-000000000032',NULL,'I love pasta recipes.', 0),
  ('00000000-0000-0000-0000-000000000073','00000000-0000-0000-0000-000000000060','00000000-0000-0000-0000-000000000033',NULL,'Use natural light for food shots.', 0),
  ('00000000-0000-0000-0000-000000000074','00000000-0000-0000-0000-000000000060','00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000073','Great tip, thanks!', 0),
  ('00000000-0000-0000-0000-000000000075','00000000-0000-0000-0000-000000000058','00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000071','Yep, that anime is awesome.', 0),
  ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000052','00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000063','Good point. What about OUTER JOINs then?', 0),
  ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000053','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000065','Totally agree! Scares me a little too, though.', 0),
  ('00000000-0000-0000-0000-000000000203','00000000-0000-0000-0000-000000000054','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000067','Flexibility vs. safety, the eternal debate! I prefer the safety net TS provides for larger projects.', 0),
  ('00000000-0000-0000-0000-000000000204','00000000-0000-0000-0000-000000000057','00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000070','Naruto is great! Have you watched Fullmetal Alchemist: Brotherhood?', 0),
  ('00000000-0000-0000-0000-000000000205','00000000-0000-0000-0000-000000000059','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000072','Me too! Especially a good lasagna. Takes time but worth it.', 0),
  ('00000000-0000-0000-0000-000000000261','00000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000033',NULL, NULL, 0)
ON CONFLICT DO NOTHING;

-- Insert Votes
INSERT INTO "Vote" ("voteId","voterUserId","postId","commentId","voteType") VALUES
  ('00000000-0000-0000-0000-000000000076','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000051',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000077','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000051',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000078','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000052',NULL, 'downvote'),
  ('00000000-0000-0000-0000-000000000079','00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000053',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000080','00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000054',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000085','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000055',NULL, 'downvote'),
  ('00000000-0000-0000-0000-000000000086','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000056',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000087','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000057',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000088','00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000058',NULL, 'downvote'),
  ('00000000-0000-0000-0000-000000000089','00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000059',NULL, 'upvote'),
  ('00000000-0000-0000-0000-000000000090','00000000-0000-0000-0000-000000000031',NULL,'00000000-0000-0000-0000-000000000061', 'upvote'),
  ('00000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000033',NULL,'00000000-0000-0000-0000-000000000061', 'upvote'),
  ('00000000-0000-0000-0000-000000000092','00000000-0000-0000-0000-000000000032',NULL,'00000000-0000-0000-0000-000000000063', 'upvote'),
  ('00000000-0000-0000-0000-000000000093','00000000-0000-0000-0000-000000000035',NULL,'00000000-0000-0000-0000-000000000066', 'downvote'),
  ('00000000-0000-0000-0000-000000000094','00000000-0000-0000-0000-000000000031',NULL,'00000000-0000-0000-0000-000000000074', 'upvote'),
  ('00000000-0000-0000-0000-000000000095','00000000-0000-0000-0000-000000000031',NULL,'00000000-0000-0000-0000-000000000071','downvote')
ON CONFLICT DO NOTHING;

-- Insert Reports
INSERT INTO "Report" ("reportId","reporterPrincipalId","postId","commentId","reason", "isHandled", "handlerPrincipalId", "handledAt") VALUES
  ('00000000-0000-0000-0000-000000000096','00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000053',NULL,'Spam content', TRUE, '00000000-0000-0000-0000-000000000026', '2025-05-04 10:00:00'),
  ('00000000-0000-0000-0000-000000000097','00000000-0000-0000-0000-000000000024',NULL,'00000000-0000-0000-0000-000000000064','Offensive language', FALSE, NULL, NULL),
  ('00000000-0000-0000-0000-000000000098','00000000-0000-0000-0000-000000000025',NULL,'00000000-0000-0000-0000-000000000074','Harassment', FALSE, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Insert System Rules
INSERT INTO "SystemRule" ("ruleId","title","description","createdByAdminId") VALUES
  ('00000000-0000-0000-0000-000000000101','Be respectful','Do not harass other users.','00000000-0000-0000-0000-000000000036'),
  ('00000000-0000-0000-0000-000000000102','No spam','Avoid posting spammy content.','00000000-0000-0000-0000-000000000037'),
  ('00000000-0000-0000-0000-000000000103','Use proper channels','Post in the correct community.','00000000-0000-0000-0000-000000000038'),
  ('00000000-0000-0000-0000-000000000104','No impersonation','Do not impersonate others.','00000000-0000-0000-0000-000000000039'),
  ('00000000-0000-0000-0000-000000000105','Follow guidelines','Abide by sitewide policies.','00000000-0000-0000-0000-000000000040')
ON CONFLICT DO NOTHING;

-- Insert Subtable Rules
INSERT INTO "SubtableRule" ("ruleId","subtableId","title","description","creatorPrincipalId") VALUES
  ('00000000-0000-0000-0000-000000000106','00000000-0000-0000-0000-000000000041','No self-promo','Do not promote your own products.','00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000107','00000000-0000-0000-0000-000000000042','Tech news only','Only post tech-related news.','00000000-0000-0000-0000-000000000022'),
  ('00000000-0000-0000-0000-000000000108','00000000-0000-0000-0000-000000000043','Verify sources','Provide credible sources for news.','00000000-0000-0000-0000-000000000023'),
  ('00000000-0000-0000-0000-000000000109','00000000-0000-0000-0000-000000000044','Spoiler policy','Use spoiler tags for spoilers.','00000000-0000-0000-0000-000000000024'),
  ('00000000-0000-0000-0000-000000000110','00000000-0000-0000-0000-000000000045','Recipe format','Follow the standard recipe format.','00000000-0000-0000-0000-000000000025')
ON CONFLICT DO NOTHING;

-- Insert Notifications
INSERT INTO "Notification" ("notificationId","recipientUserId","triggeringPrincipalId","type","sourceUrl","content", "isRead") VALUES
  ('00000000-0000-0000-0000-000000000111','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000022','comment_reply','/comments/00000000-0000-0000-0000-000000000052#comment-00000000-0000-0000-0000-000000000064','Someone replied to your comment', FALSE),
  ('00000000-0000-0000-0000-000000000112','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000023','post_reply','/comments/00000000-0000-0000-0000-000000000053#comment-00000000-0000-0000-0000-000000000065','New comment on your post', TRUE),
  ('00000000-0000-0000-0000-000000000113','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000024','mention','/comments/00000000-0000-0000-0000-000000000054','You were mentioned in a post', FALSE),
  ('00000000-0000-0000-0000-000000000115','00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000021','moderator_invite','/s/AskAnything','You have been invited as a moderator', FALSE)
ON CONFLICT DO NOTHING;

-- Insert Messages
INSERT INTO "Message" ("messageId", "parentMessageId", "senderPrincipalId", "recipientPrincipalId", "body", "messageType", "isRead") VALUES
  ('00000000-0000-0000-0000-000000000116', NULL, '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', 'Hi User 2, I have a question.', 'direct', TRUE),
  ('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000021', 'Sure, how can I help?', 'direct', FALSE),
  ('00000000-0000-0000-0000-000000000118', NULL, '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024', 'I found a bug in the forum.', 'direct', FALSE),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000118', NULL, '00000000-0000-0000-0000-000000000021', 'Thanks for reporting, we’ll look into it.', 'system', FALSE),
  ('00000000-0000-0000-0000-000000000120', NULL, '00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000025', 'Can I post images?', 'direct', TRUE),
  ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000120', NULL, '00000000-0000-0000-0000-000000000024', 'Yes, you can upload media.', 'system', TRUE),
  ('00000000-0000-0000-0000-000000000122', NULL, '00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000023', 'Welcome to the community!', 'direct', FALSE),
  ('00000000-0000-0000-0000-000000000124', NULL, NULL, '00000000-0000-0000-0000-000000000025', 'Don’t forget the meeting tomorrow.', 'system', FALSE)
ON CONFLICT DO NOTHING;

-- Insert Bans
INSERT INTO "Ban" ("banId","bannedAccountId","issuerPrincipalId","subtableId","reason","expiresAt") VALUES
  ('00000000-0000-0000-0000-000000000136','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000029',NULL,'Violation of terms','2025-06-01 00:00:00'),
  ('00000000-0000-0000-0000-000000000137','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000044','Spamming','2025-05-25 12:00:00'),
  ('00000000-0000-0000-0000-000000000138','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000026',NULL,'Harassment',NULL),
  ('00000000-0000-0000-0000-000000000139','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000042','Off-topic posts','2025-05-30 08:00:00'),
  ('00000000-0000-0000-0000-000000000140','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000028',NULL,'Multiple accounts',NULL)
ON CONFLICT DO NOTHING;

-- Insert Moderator Logs (Simplified)
INSERT INTO "ModeratorLog" ("logId","moderatorUserId","subtableId","details") VALUES
  ('00000000-0000-0000-0000-000000000141','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000041','Inappropriate content'),
  ('00000000-0000-0000-0000-000000000142','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000042','Repeated spam'),
  ('00000000-0000-0000-0000-000000000143','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000043','Looks good'),
  ('00000000-0000-0000-0000-000000000144','00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000044','Time served'),
  ('00000000-0000-0000-0000-000000000145','00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000045','Closed discussion')
ON CONFLICT DO NOTHING;

-- Insert Admin Logs (Simplified)
-- Admin actor identified by Admin.adminId. Original AdminId values are used.
INSERT INTO "AdminLog" ("logId","adminId","details") VALUES
  ('00000000-0000-0000-0000-000000000146','00000000-0000-0000-0000-000000000036','Policy violation resulting in account suspension of principal 00000000-0000-0000-0000-000000000025.'),
  ('00000000-0000-0000-0000-000000000147','00000000-0000-0000-0000-000000000037','Obsolete community (Subtable 00000000-0000-0000-0000-000000000045) deleted.'),
  ('00000000-0000-0000-0000-000000000148','00000000-0000-0000-0000-000000000038','Promoted principal 00000000-0000-0000-0000-000000000030 to admin role.'),
  ('00000000-0000-0000-0000-000000000149','00000000-0000-0000-0000-000000000039','Updated description for Subtable 00000000-0000-0000-0000-000000000042.'),
  ('00000000-0000-0000-0000-000000000150','00000000-0000-0000-0000-000000000040','User request fulfilled to delete Post 00000000-0000-0000-0000-000000000055.')
ON CONFLICT DO NOTHING;

-- End of Script --