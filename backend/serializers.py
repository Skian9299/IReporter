from marshmallow import Schema, fields

# User Schema
class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    email = fields.Email(required=True)
    is_admin = fields.Bool(dump_only=True)
    is_active = fields.Bool(dump_only=True)

# RedFlag Schema
class RedFlagSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    location = fields.Str(required=True)
    status = fields.Str(dump_only=True)
    image_url = fields.Str(dump_only=True)  # ✅ Added image_url
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    user_id = fields.Int(required=True)

# Intervention Schema
class InterventionSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    location = fields.Str(required=True)
    status = fields.Str(dump_only=True)
    image_url = fields.Str(dump_only=True)  # ✅ Added image_url
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    user_id = fields.Int(required=True)

# Initialize Schemas
user_schema = UserSchema()
redflag_schema = RedFlagSchema()
redflags_schema = RedFlagSchema(many=True)
intervention_schema = InterventionSchema()
interventions_schema = InterventionSchema(many=True)