# frozen_string_literal: true

require 'spec_helper'
require './lib/wulin_master/components/grid/toolbar'

describe WulinMaster::Toolbar do
  it 'should has items created from actions' do
    actions = [{ name: 'create' }, { name: 'export'}]
    toolbar = WulinMaster::Toolbar.new('country_grid', actions)

    expect(toolbar.items.size).to eq(2)
    toolbar.items.each { |item| expect(item).to be_a WulinMaster::ToolbarItem }
    expect(toolbar.items.first.icon).to eq('add_box')
    expect(toolbar.items.first.options[:name]).to eq('create')
    expect(toolbar.items.last.icon).to eq('file_download')
    expect(toolbar.items.last.options[:name]).to eq('export')
  end
end
