

const API_URL = 'http://localhost:5000/api';


export const createVenue = async (venueFormData) => {
  try {
    const response = await fetch(`${API_URL}/venues`, {
      method: 'POST',
      body: venueFormData, 
      headers: {
        // 'Authorization': `Bearer ${localStorage.getItem('token')}` 
      }
    });
    
    if (!response.ok) throw new Error('فشل حفظ الملعب في الداتابيز');
    return await response.json();
  } catch (error) {
    console.error("Error in createVenue:", error);
    throw error;
  }
};


export const updateVenue = async (id, venueFormData) => {
  try {
    const response = await fetch(`${API_URL}/venues/${id}`, {
      method: 'PUT',
      body: venueFormData,
    });

    if (!response.ok) throw new Error('فشل تحديث الملعب في الداتابيز');
    return await response.json();
  } catch (error) {
    console.error("Error in updateVenue:", error);
    throw error;
  }
};