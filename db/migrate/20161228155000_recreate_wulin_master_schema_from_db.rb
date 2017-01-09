class RecreateWulinMasterSchemaFromDb < ActiveRecord::Migration[5.0]
  def change
    create_table "grid_states", force: :cascade do |t|
      t.integer  "user_id"
      t.string   "grid_name"
      t.string   "state_value"
      t.string   "name",        default: "default"
      t.boolean  "current",     default: false,     null: false
      t.datetime "created_at"
      t.datetime "updated_at"
    end
    add_index :grid_states, :user_id
  end
end