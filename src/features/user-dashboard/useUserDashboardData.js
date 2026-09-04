import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const fallbackDestinations = [
  {
    name: 'Donsol Whale Shark Interaction',
    slug: 'donsol-whale-shark-interaction',
    municipality: 'Donsol',
    category: 'Wildlife',
    description:
      'A guided wildlife experience in Donsol where visitors can responsibly encounter whale sharks during the season.',
    address: 'Donsol, Sorsogon',
    best_time: 'November to June',
    opening_hours: 'Tour schedule varies',
    entrance_fee: 'Tour fees vary',
    contact_info: 'Donsol tourism office',
    travel_tips: 'Book with accredited operators and follow briefing rules before the interaction.',
    latitude: 12.9055,
    longitude: 123.5947,
    image_url:
      'https://images.unsplash.com/photo-1540202404-b2979d19ed37?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Bulusan Lake',
    slug: 'bulusan-lake',
    municipality: 'Bulusan',
    category: 'Nature',
    description:
      'A cool mountain lake destination near Bulusan Volcano, known for kayaking, quiet scenery, and nature walks.',
    address: 'Bulusan Volcano Natural Park, Bulusan',
    best_time: 'November to May',
    opening_hours: 'Daytime visits recommended',
    entrance_fee: 'Fees may apply',
    contact_info: 'Bulusan tourism office',
    travel_tips: 'Bring light rain protection and check local weather before traveling.',
    latitude: 12.7669,
    longitude: 124.0871,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Kayaking_at_Bulusan_Lake.jpg',
  },
  {
    name: 'Subic Beach',
    slug: 'subic-beach',
    municipality: 'Matnog',
    category: 'Beach',
    description:
      'A popular island-hopping stop in Matnog with clear water, beach views, and boat-access routes.',
    address: 'Matnog, Sorsogon',
    best_time: 'Dry season',
    opening_hours: 'Day tours recommended',
    entrance_fee: 'Boat and environmental fees may apply',
    contact_info: 'Matnog tourism office',
    travel_tips: 'Arrange boats early and bring dry bags for island hopping.',
    latitude: 12.5708,
    longitude: 124.0858,
    image_url:
      'https://i0.wp.com/joansfootprints.com/wp-content/uploads/2024/08/grouphie-4-1-1024x576.jpg?resize=1024%2C576&ssl=1',
  },
  {
    name: 'Sorsogon City Baywalk',
    slug: 'sorsogon-city-baywalk',
    municipality: 'Sorsogon City',
    category: 'City Attraction',
    description:
      'A city waterfront stop for sunset walks, casual food trips, and relaxed views of Sorsogon Bay.',
    address: 'Sorsogon City, Sorsogon',
    best_time: 'Year-round',
    opening_hours: 'Open public area',
    entrance_fee: 'Free',
    contact_info: 'Sorsogon City tourism office',
    travel_tips: 'Visit late afternoon for cooler weather and sunset views.',
    latitude: 12.9731,
    longitude: 123.9935,
    image_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
];

const fallbackAccommodations = [
  {
    id: 'fallback-city-hotel',
    name: 'Sample City Hotel',
    slug: 'sample-city-hotel',
    accommodation_type: 'Hotel',
    municipality: 'Sorsogon City',
    address: 'Sorsogon City Center',
    price_range: 'Budget to mid-range',
    amenities: 'Wi-Fi, air conditioning, family rooms',
    contact_info: 'Add official contact later',
    image_url:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    latitude: 12.9742,
    longitude: 123.9937,
  },
  {
    id: 'fallback-beach-resort',
    name: 'Sample Beach Resort',
    slug: 'sample-beach-resort',
    accommodation_type: 'Resort',
    municipality: 'Matnog',
    address: 'Near Matnog coastal area',
    price_range: 'Mid-range',
    amenities: 'Beach access, island hopping assistance, meals',
    contact_info: 'Add official contact later',
    image_url:
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
    latitude: 12.57,
    longitude: 124.084,
  },
  {
    id: 'fallback-nature-homestay',
    name: 'Sample Nature Homestay',
    slug: 'sample-nature-homestay',
    accommodation_type: 'Homestay',
    municipality: 'Bulusan',
    address: 'Near Bulusan Lake area',
    price_range: 'Budget',
    amenities: 'Local host, nature access, breakfast option',
    contact_info: 'Add official contact later',
    image_url:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    latitude: 12.766,
    longitude: 124.086,
  },
];

export function useUserDashboardData(user) {
  const [destinations, setDestinations] = useState(fallbackDestinations);
  const [accommodations, setAccommodations] = useState(fallbackAccommodations);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [travelPlans, setTravelPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const destinationBySlug = useMemo(() => {
    return destinations.reduce((map, destination) => {
      map[destination.slug] = destination;
      return map;
    }, {});
  }, [destinations]);

  const savedDestinations = favorites.map((favorite) => {
    const destination = destinationBySlug[favorite.destination_slug];
    return {
      ...favorite,
      title: destination?.name || favorite.destination_slug,
      location: destination?.municipality || 'Sorsogon',
      category: destination?.category || 'Saved place',
      bestTime: destination?.best_time || 'Year-round',
    };
  });
  const savedDestinationSlugs = useMemo(
    () => new Set(favorites.map((favorite) => favorite.destination_slug)),
    [favorites],
  );

  async function loadDashboard({ silent = false, shouldApply = () => true } = {}) {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    setMessage('');

    const [
      destinationsResult,
      accommodationsResult,
      favoritesResult,
      reviewsResult,
      approvedReviewsResult,
      submissionsResult,
      travelPlansResult,
    ] =
      await Promise.all([
        supabase
          .from('destinations')
          .select(
            'name, slug, municipality, category, description, address, best_time, opening_hours, entrance_fee, contact_info, travel_tips, latitude, longitude, image_url, is_featured',
          )
          .eq('is_published', true)
          .order('name', { ascending: true }),
        supabase
          .from('accommodations')
          .select(
            'id, name, accommodation_type, municipality, address, price_range, amenities, contact_info, image_url, latitude, longitude',
          )
          .eq('is_published', true)
          .order('name', { ascending: true }),
        supabase
          .from('favorites')
          .select('destination_slug, created_at')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('destination_slug, rating, title, body, status, created_at')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('destination_slug, rating, title, body, user_email, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false }),
        supabase
          .from('submissions')
          .select('submission_type, name, municipality, description, contact_info, status, submitted_at')
          .eq('submitter_email', user.email)
          .order('submitted_at', { ascending: false }),
        supabase
          .from('travel_plans')
          .select('id, day, destination_slug, notes, sort_order, created_at')
          .eq('user_email', user.email)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

    if (!shouldApply()) return;

    if (destinationsResult.data?.length) setDestinations(destinationsResult.data);
    if (accommodationsResult.data?.length) setAccommodations(accommodationsResult.data);
    setFavorites(favoritesResult.data || []);
    setReviews(reviewsResult.data || []);
    setApprovedReviews(approvedReviewsResult.data || []);
    setSubmissions(submissionsResult.data || []);
    setTravelPlans(travelPlansResult.data || []);

    const firstError =
      destinationsResult.error ||
      accommodationsResult.error ||
      favoritesResult.error ||
      reviewsResult.error ||
      approvedReviewsResult.error ||
      submissionsResult.error ||
      travelPlansResult.error;

    if (firstError) {
      setMessage(`Some dashboard data could not be loaded: ${firstError.message}`);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    loadDashboard({ shouldApply: () => isMounted });

    return () => {
      isMounted = false;
    };
  }, [user.email]);

  async function addReview(review) {
    if (!supabase) return { error: { message: 'Supabase is not configured yet.' } };

    setMessage('');
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        destination_slug: review.destination_slug,
        rating: Number(review.rating),
        title: review.title.trim(),
        body: review.body.trim(),
        status: 'pending',
        user_email: user.email,
      })
      .select('destination_slug, rating, title, body, status, created_at')
      .single();

    if (error) return { error };

    setReviews((current) => [data, ...current]);
    return { data };
  }

  async function addSubmission(submission) {
    if (!supabase) return { error: { message: 'Supabase is not configured yet.' } };

    setMessage('');
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        submission_type: submission.submission_type,
        name: submission.name.trim(),
        municipality: submission.municipality.trim(),
        description: submission.description.trim() || null,
        contact_info: submission.contact_info.trim() || null,
        status: 'pending',
        submitter_email: user.email,
      })
      .select('submission_type, name, municipality, description, contact_info, status, submitted_at')
      .single();

    if (error) return { error };

    setSubmissions((current) => [data, ...current]);
    return { data };
  }

  async function addTravelPlan(plan) {
    if (!supabase) return { error: { message: 'Supabase is not configured yet.' } };

    setMessage('');
    const { data, error } = await supabase
      .from('travel_plans')
      .insert({
        user_email: user.email,
        day: plan.day.trim(),
        destination_slug: plan.destination_slug,
        notes: plan.notes.trim() || null,
        sort_order: travelPlans.length + 1,
      })
      .select('id, day, destination_slug, notes, sort_order, created_at')
      .single();

    if (error) return { error };

    setTravelPlans((current) => [...current, data]);
    return { data };
  }

  async function removeTravelPlan(planId) {
    if (!supabase || !planId) return { error: { message: 'Missing travel plan id.' } };

    setMessage('');
    const { error } = await supabase
      .from('travel_plans')
      .delete()
      .eq('id', planId)
      .eq('user_email', user.email);

    if (error) return { error };

    setTravelPlans((current) => current.filter((plan) => plan.id !== planId));
    return {};
  }

  async function toggleFavorite(destinationSlug) {
    if (!supabase || !destinationSlug) return;

    setMessage('');
    const isSaved = savedDestinationSlugs.has(destinationSlug);

    if (isSaved) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_email', user.email)
        .eq('destination_slug', destinationSlug);

      if (error) {
        setMessage(`Unable to remove saved place: ${error.message}`);
        return;
      }

      setFavorites((current) =>
        current.filter((favorite) => favorite.destination_slug !== destinationSlug),
      );
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_email: user.email,
        destination_slug: destinationSlug,
      })
      .select('destination_slug, created_at')
      .single();

    if (error) {
      setMessage(`Unable to save place: ${error.message}`);
      return;
    }

    setFavorites((current) => [data, ...current]);
  }

  return {
    addReview,
    addSubmission,
    addTravelPlan,
    accommodations,
    approvedReviews,
    destinations,
    isLoading,
    loadDashboard,
    message,
    reviews,
    savedDestinationSlugs,
    savedDestinations,
    setMessage,
    submissions,
    toggleFavorite,
    travelPlans,
    removeTravelPlan,
  };
}
