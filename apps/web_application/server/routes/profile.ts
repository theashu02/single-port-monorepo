import { Elysia, t } from "elysia";
import { getServerAuthSession } from "@/core/auth/session";
import { connectToDatabase } from "@/core/db/mongoose";
import { UserModel } from "@/core/models/user";
import { GuestLoginModel } from "@/core/models/guest_login";

export const profileRoutes = new Elysia({ prefix: '/profile' })
  .get("/", async ({ set }) => {
    try {
      const session = await getServerAuthSession();
      if (!session || !session.user || !session.user.user_id) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      await connectToDatabase();
      
      // Handle Guest Users
      if (session.user.auth_type === "guest") {
        const guest = await GuestLoginModel.findOne({ guest_id: session.user.user_id }).lean();
        if (!guest) {
          set.status = 404;
          return { error: "Guest User not found" };
        }
        return {
          success: true,
          data: {
            name: guest.nickname || session.user.display_name,
            handle: "",
            age: undefined,
            country: "",
            bio: "",
            image: guest.avatar_id || session.user.avatar
          }
        };
      }

      // Handle Regular Users
      const user = await UserModel.findById(session.user.user_id).lean();
      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      return {
        success: true,
        data: {
          name: user.name || session.user.display_name || "",
          handle: user.handle || "",
          age: user.age,
          country: user.country || "",
          bio: user.bio || "",
          image: user.image || session.user.avatar || ""
        }
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })
  .put("/", async ({ body, set }) => {
    try {
      const session = await getServerAuthSession();
      if (!session || !session.user || !session.user.user_id) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { name, handle, age, country, bio } = body;
      
      await connectToDatabase();

      if (session.user.auth_type === "guest") {
        const updatedGuest = await GuestLoginModel.findOneAndUpdate(
          { guest_id: session.user.user_id },
          { $set: { nickname: name } },
          { new: true }
        ).lean();

        if (!updatedGuest) {
          set.status = 404;
          return { error: "Guest not found" };
        }
        return {
          success: true,
          data: {
            name: updatedGuest.nickname,
            handle: "",
            age: undefined,
            country: "",
            bio: "",
            image: updatedGuest.avatar_id
          }
        }
      }
      
      if (handle) {
        const existingHandle = await UserModel.findOne({ handle, _id: { $ne: session.user.user_id } });
        if (existingHandle) {
          set.status = 400;
          return { error: "Handle is already taken" };
        }
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        session.user.user_id,
        {
          $set: {
            name,
            handle,
            age,
            country,
            bio,
          }
        },
        { new: true }
      ).lean();

      if (!updatedUser) {
        set.status = 404;
        return { error: "User not found" };
      }

      return {
        success: true,
        data: {
          name: updatedUser.name,
          handle: updatedUser.handle,
          age: updatedUser.age,
          country: updatedUser.country,
          bio: updatedUser.bio,
          image: updatedUser.image
        }
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      set.status = 500;
      return { error: "Internal server error" };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      handle: t.Optional(t.String()),
      age: t.Optional(t.Numeric()),
      country: t.Optional(t.String()),
      bio: t.Optional(t.String())
    })
  });
