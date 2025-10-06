# Event Settings Component - Backend Integration Guide

This EventSettings component has been created without dummy data and is ready for backend integration with your Django API.

## Features

- ✅ **No dummy data** - Clean component ready for real API integration
- ✅ **TypeScript interfaces** - Properly typed for backend compatibility
- ✅ **Backend-friendly field names** - Uses snake_case to match Django conventions
- ✅ **Comprehensive validation** - Form validation with error messages
- ✅ **Loading and saving states** - Proper UX feedback during API calls
- ✅ **Modular design** - Easy to maintain and extend

## Backend Integration

### 1. API Service Setup

The component includes placeholder API calls in:
- `/src/services/eventSettings.ts` - Service functions for CRUD operations
- `/src/pages/planner/EventSettings.tsx` - Main component with API integration points

### 2. Django Backend Endpoints Needed

Create these endpoints in your Django backend:

```python
# events/urls.py
urlpatterns = [
    path('api/events/', EventListCreateView.as_view(), name='event-list-create'),
    path('api/events/<int:pk>/settings/', EventSettingsView.as_view(), name='event-settings'),
    path('api/events/<int:pk>/publish/', EventPublishView.as_view(), name='event-publish'),
]
```

### 3. Expected API Response Format

The component expects your Django API to return data in this format:

```json
{
  "id": 1,
  "name": "Tech Conference 2024",
  "status": "DRAFT",
  "timezone": "Australia/Brisbane", 
  "date": "2025-03-15",
  "start_time": "09:00",
  "end_time": "18:00",
  "description": "Annual technology conference",
  "venue": {
    "name": "Convention Center",
    "address": "123 Main St",
    "map_url": "https://maps.google.com/...",
    "capacity": 500,
    "rooms": [
      {
        "id": "room-1",
        "name": "Main Hall", 
        "capacity": 300
      }
    ]
  },
  "seating_rules": {
    "table_size_default": 10,
    "max_per_table": 12,
    "keep_groups_together": true,
    "separate_dietary": false,
    "aisle_width": 120,
    "layout_template_id": "template-1"
  },
  "groups": ["VIP", "Speakers", "Staff"],
  "tags": {
    "dietary": ["Vegetarian", "Gluten-free"],
    "access": ["Wheelchair", "Hearing"]
  },
  "vendors": [
    {
      "id": "vendor-1",
      "type": "CATERING",
      "name": "Catering Co.",
      "contact": "catering@example.com"
    }
  ],
  "roles": {
    "planner_uids": ["user1", "user2"],
    "vendor_uids": ["vendor1"]
  },
  "checkin": {
    "enabled": true,
    "qr_prefix": "TC24",
    "kiosk_pin": "1234",
    "opens_at": "08:00",
    "closes_at": "18:00",
    "offline_hint": "Contact reception for assistance"
  },
  "comms": {
    "rsvp_template": "template-rsvp",
    "reminder_template": "template-reminder", 
    "day_of_sms_template": "template-sms"
  },
  "accessibility": {
    "statement": "This venue is fully accessible...",
    "evacuation_note": "In case of emergency..."
  },
  "privacy": {
    "consent_text": "We collect data for...",
    "retention_days": 90
  },
  "exports": {
    "caterer_preset": "dietary_breakdown_v1",
    "seating_preset": "table_assignments_v1"
  },
  "integrations": {
    "sheet_sync": {
      "enabled": false,
      "sheet_id": ""
    }
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 4. Authentication Integration

To connect with your existing authentication system:

1. **Import your API client**:
   ```typescript
   import { api } from '../../lib/api';
   ```

2. **Replace the placeholder API calls** in `EventSettings.tsx`:
   ```typescript
   // Replace this placeholder:
   console.log(`Loading event settings for ID: ${id}`);
   
   // With actual API call:
   const response = await api.get(`/api/events/${id}/settings/`);
   setSettings(response.data);
   ```

### 5. Integration Steps

1. **Update the API calls** in `loadEventSettings()`, `save()`, and `publish()` methods
2. **Connect to your authentication system** - the component already expects JWT tokens
3. **Test with your Django backend** endpoints
4. **Handle error states** - the component already has error handling built in

### 6. Usage

Once connected to your backend, you can use the component like this:

```typescript
import EventSettingsPage from './pages/planner/EventSettings';

// For new events
<Route path="/planner/events/new" component={EventSettingsPage} />

// For existing events  
<Route path="/planner/events/:eventId/settings" component={EventSettingsPage} />
```

### 7. Django Model Compatibility

Your Django Event model should have fields matching the interface:

```python
class Event(models.Model):
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timezone = models.CharField(max_length=50)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    description = models.TextField(blank=True)
    # ... other fields matching the EventSettings interface
```

## Next Steps

1. Replace all `TODO` comments with actual API calls
2. Test the component with your Django backend
3. Add any custom validation rules specific to your business logic
4. Style the component to match your app's design system

The component is fully functional and ready to work with your existing Django backend once the API calls are connected!
