import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";

const AddManuItems = ({ onItemAdded }: { onItemAdded: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const resetform =() => {
    setName("");
    setDescription("");
    setPrice("");
    setImage(null);
  }

  const handleSubmit = async () => {
    if(!name || !price || !image){
      alert("All fields are required");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("file", image);

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/item/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Menu item added successfully");

      // alert("Menu item added successfully");
      resetform();
      onItemAdded();
    } catch (error) {
      console.log(error);
      toast.error("Failed to add menu item");
      
      // alert("Failed to add menu item");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="max-w-md space-y-4 m-auto">
      <h2 className="text-lg font-semibold">Add Menu Item</h2>
      <input
        type="text"
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
      />
      <textarea
        placeholder="Item description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
      />
      <input
        type="number"
        placeholder="price ₹"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
        <BiUpload className="h-5 w-5 text-red-500" />
        {image ? image.name : "Upload restaurant image"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </label>

      <button
        disabled={loading}
        onClick={handleSubmit}
        className="w-full rounded-lg text-white text-sm py-3 font-semibold transition bg-red-500 cursor-pointer"
      >
        {loading ? "Adding..." : "Add Item"}
      </button>
    </div>
  )
}

export default AddManuItems