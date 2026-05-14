export interface ProfileData {
  name?: string;
  handle?: string;
  age?: number;
  country?: string;
  bio?: string;
  image?: string;
}

export const getProfile = async (): Promise<ProfileData | null> => {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data?.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching profile API:", error);
    throw error;
  }
};

export const updateProfile = async (profileData: ProfileData): Promise<ProfileData | null> => {
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    const data = await response.json();
    if (data?.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Error updating profile API:", error);
    throw error;
  }
};
