
-- Unique constraints for atomic upsert
ALTER TABLE public.attendances
  ADD CONSTRAINT attendances_session_student_unique UNIQUE (session_id, student_id);

ALTER TABLE public.grades
  ADD CONSTRAINT grades_assessment_student_unique UNIQUE (assessment_id, student_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid,
  title text NOT NULL,
  body text,
  link text,
  type text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notif - own view" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Notif - own update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Notif - own delete" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Notif - staff insert in school" ON public.notifications
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (school_id = get_user_school(auth.uid())
        AND (has_role(auth.uid(), 'director'::app_role)
          OR has_role(auth.uid(), 'deputy_director'::app_role)
          OR has_role(auth.uid(), 'secretary'::app_role)
          OR has_role(auth.uid(), 'teacher'::app_role)
          OR has_role(auth.uid(), 'main_teacher'::app_role)))
  );

-- Messaging
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  title text,
  is_group boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_school_idx ON public.conversations(school_id);

CREATE TABLE public.conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE (conversation_id, user_id)
);
CREATE INDEX conv_members_user_idx ON public.conversation_members(user_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper: is member of conversation (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Conv - member view" ON public.conversations
  FOR SELECT USING (is_conversation_member(auth.uid(), id) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Conv - school staff create" ON public.conversations
  FOR INSERT WITH CHECK (
    school_id = get_user_school(auth.uid())
    AND created_by = auth.uid()
  );
CREATE POLICY "Conv - creator update" ON public.conversations
  FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Conv - creator delete" ON public.conversations
  FOR DELETE USING (created_by = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "ConvMembers - member view" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_conversation_member(auth.uid(), conversation_id)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
CREATE POLICY "ConvMembers - manage by member" ON public.conversation_members
  FOR ALL USING (
    is_conversation_member(auth.uid(), conversation_id)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  ) WITH CHECK (
    is_conversation_member(auth.uid(), conversation_id)
    OR user_id = auth.uid()
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Msg - member view" ON public.messages
  FOR SELECT USING (is_conversation_member(auth.uid(), conversation_id) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Msg - member send" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Msg - sender delete" ON public.messages
  FOR DELETE USING (sender_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
