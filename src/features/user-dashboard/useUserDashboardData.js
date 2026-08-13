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

export function useUserDashboardData(user) {
  const [destinations, setDestinations] = useState(fallbackDestinations);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [submissions, setSubmissions] = useState([]);
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

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setMessage('');

      const [destinationsResult, favoritesResult, reviewsResult, submissionsResult] =
        await Promise.all([
          supabase
            .from('destinations')
            .select(
              'name, slug, municipality, category, description, address, best_time, opening_hours, entrance_fee, contact_info, travel_tips, latitude, longitude, image_url, is_featured',
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
            .from('submissions')
            .select('submission_type, name, municipality, status, submitted_at')
            .eq('submitter_email', user.email)
            .order('submitted_at', { ascending: false }),
        ]);

      if (!isMounted) return;

      if (destinationsResult.data?.length) setDestinations(destinationsResult.data);
      setFavorites(favoritesResult.data || []);
      setReviews(reviewsResult.data || []);
      setSubmissions(submissionsResult.data || []);

      const firstError =
        destinationsResult.error ||
        favoritesResult.error ||
        reviewsResult.error ||
        submissionsResult.error;

      if (firstError) {
        setMessage(`Some dashboard data could not be loaded: ${firstError.message}`);
      }

      setIsLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user.email]);

  return {
    destinations,
    isLoading,
    message,
    reviews,
    savedDestinations,
    setMessage,
    submissions,
  };
}
